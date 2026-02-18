#!/bin/bash
set -euo pipefail

# agentic-workstation bootstrap
# Idempotent setup for a solo agentic coding environment on Ubuntu 24.04.
# Run as root on a fresh VPS — creates 'dev' user and re-executes.
# Safe to run multiple times.

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*" >&2; }
section() { echo -e "\n${BOLD}=== $* ===${NC}"; }

# ─── Section 0: Root check + user creation ────────────────────────────────────
if [ "$(id -u)" -eq 0 ]; then
    section "Creating dev user"

    if id "dev" &>/dev/null; then
        log "User 'dev' already exists"
    else
        useradd -m -s /bin/bash -G sudo dev
        echo "dev ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/dev
        chmod 440 /etc/sudoers.d/dev
        log "Created user 'dev' with passwordless sudo"
    fi

    # Copy SSH keys from root
    if [ -d /root/.ssh ]; then
        mkdir -p /home/dev/.ssh
        cp /root/.ssh/authorized_keys /home/dev/.ssh/authorized_keys 2>/dev/null || true
        chown -R dev:dev /home/dev/.ssh
        chmod 700 /home/dev/.ssh
        chmod 600 /home/dev/.ssh/authorized_keys 2>/dev/null || true
        log "Copied SSH keys to dev user"
    else
        warn "No SSH keys found in /root/.ssh — you'll need to add them manually"
    fi

    # Copy repo to dev home if not already there
    DEV_REPO="/home/dev/agentic-workstation"
    if [ ! -d "$DEV_REPO" ]; then
        cp -r "$REPO_DIR" "$DEV_REPO"
        chown -R dev:dev "$DEV_REPO"
        log "Copied repo to $DEV_REPO"
    fi

    echo ""
    echo -e "${BOLD}${YELLOW}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${YELLOW}║  IMPORTANT: Test SSH as 'dev' in a NEW terminal     ║${NC}"
    echo -e "${BOLD}${YELLOW}║  before closing this session!                        ║${NC}"
    echo -e "${BOLD}${YELLOW}║                                                      ║${NC}"
    echo -e "${BOLD}${YELLOW}║  ssh dev@<this-server-ip>                            ║${NC}"
    echo -e "${BOLD}${YELLOW}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Re-execute as dev
    log "Re-executing bootstrap as dev..."
    exec su - dev -c "cd $DEV_REPO && ./bootstrap.sh"
fi

# ─── From here, running as dev (non-root) ─────────────────────────────────────

section "Apt packages"

PACKAGES=(
    git curl wget tmux ripgrep jq htop tree unzip
    build-essential fail2ban ufw
)

# Check if we need to install anything
NEED_INSTALL=false
for pkg in "${PACKAGES[@]}"; do
    if ! dpkg -l "$pkg" &>/dev/null; then
        NEED_INSTALL=true
        break
    fi
done

if [ "$NEED_INSTALL" = true ]; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq "${PACKAGES[@]}"
    log "Packages installed"
else
    log "All packages already installed"
fi

# batcat → bat symlink
if command -v batcat &>/dev/null && ! command -v bat &>/dev/null; then
    sudo ln -sf "$(which batcat)" /usr/local/bin/bat
    log "Created bat → batcat symlink"
elif command -v bat &>/dev/null; then
    log "bat already available"
fi

# ─── Section 2: SSH hardening ─────────────────────────────────────────────────
section "SSH hardening"

SSHD_CONFIG="/etc/ssh/sshd_config"

# Safety check: only harden if dev user has SSH keys
if [ -f "$HOME/.ssh/authorized_keys" ] && [ -s "$HOME/.ssh/authorized_keys" ]; then
    SSHD_CHANGED=false

    harden_sshd() {
        local key="$1" value="$2"
        if grep -q "^${key} ${value}$" "$SSHD_CONFIG" 2>/dev/null; then
            return
        fi
        # Comment out existing lines for this key
        sudo sed -i "s/^${key} .*/#&/" "$SSHD_CONFIG"
        # Add our setting
        echo "${key} ${value}" | sudo tee -a "$SSHD_CONFIG" >/dev/null
        SSHD_CHANGED=true
    }

    harden_sshd "PermitRootLogin" "no"
    harden_sshd "PasswordAuthentication" "no"
    harden_sshd "MaxAuthTries" "3"
    harden_sshd "PubkeyAuthentication" "yes"

    if [ "$SSHD_CHANGED" = true ]; then
        sudo systemctl reload sshd 2>/dev/null || sudo systemctl reload ssh 2>/dev/null || true
        log "SSH hardened (key-only, no root, max 3 tries)"
        echo ""
        warn "SSH config changed. TEST SSH IN A NEW TERMINAL before closing this one!"
        echo ""
    else
        log "SSH already hardened"
    fi
else
    warn "No SSH keys found for dev — skipping SSH hardening to prevent lockout"
    warn "Add your public key to ~/.ssh/authorized_keys, then re-run bootstrap.sh"
fi

# ─── Section 3: UFW firewall ──────────────────────────────────────────────────
section "Firewall (UFW)"

if ! sudo ufw status | grep -q "Status: active"; then
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow OpenSSH
    echo "y" | sudo ufw enable
    log "UFW enabled (SSH only)"
else
    log "UFW already active"
fi

# ─── Section 4: Node.js via nvm ───────────────────────────────────────────────
section "Node.js 22 (via nvm)"

export NVM_DIR="$HOME/.nvm"

if [ ! -d "$NVM_DIR" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    log "nvm installed"
fi

# Source nvm for this session
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if ! nvm ls 22 &>/dev/null; then
    nvm install 22
    nvm alias default 22
    log "Node.js 22 installed"
else
    log "Node.js 22 already installed"
fi

# ─── Section 5: GitHub CLI ────────────────────────────────────────────────────
section "GitHub CLI (gh)"

if ! command -v gh &>/dev/null; then
    # Add GitHub CLI apt repo
    (type -p wget >/dev/null || sudo apt-get install wget -y) \
        && sudo mkdir -p -m 755 /etc/apt/keyrings \
        && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
        && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
        && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
        && sudo apt-get update -qq \
        && sudo apt-get install gh -y -qq
    log "GitHub CLI installed"
else
    log "GitHub CLI already installed"
fi

# ─── Section 6: Claude Code CLI ───────────────────────────────────────────────
section "Claude Code CLI"

if ! command -v claude &>/dev/null; then
    npm install -g @anthropic-ai/claude-code
    log "Claude Code CLI installed"
else
    log "Claude Code CLI already installed ($(claude --version 2>/dev/null || echo 'version unknown'))"
fi

# ─── Section 7: Directory structure ───────────────────────────────────────────
section "Directory structure"

mkdir -p "$HOME/projects" "$HOME/worktrees" "$HOME/bin" "$HOME/.agent-logs"
log "Created ~/projects, ~/worktrees, ~/bin, ~/.agent-logs"

# ─── Section 8: Config files ──────────────────────────────────────────────────
section "Config files"

# tmux.conf
cp "$REPO_DIR/config/tmux.conf" "$HOME/.tmux.conf"
log "Installed ~/.tmux.conf"

# Global CLAUDE.md
mkdir -p "$HOME/.claude"
cp "$REPO_DIR/config/global-claude.md" "$HOME/.claude/CLAUDE.md"
log "Installed ~/.claude/CLAUDE.md"

# Skills
mkdir -p "$HOME/.claude/skills"
cp "$REPO_DIR/skills/"*.md "$HOME/.claude/skills/"
log "Installed skills to ~/.claude/skills/"

# Templates (used by new-project, clone-project)
mkdir -p "$HOME/.agentic-workstation"
cp -r "$REPO_DIR/templates" "$HOME/.agentic-workstation/"
log "Installed templates to ~/.agentic-workstation/templates/"

# Bin scripts
cp "$REPO_DIR/bin/"* "$HOME/bin/"
chmod +x "$HOME/bin/"*
log "Installed helper scripts to ~/bin/"

# ─── Section 9: Shell config ──────────────────────────────────────────────────
section "Shell config"

MARKER="# --- agentic-workstation ---"
if ! grep -q "$MARKER" "$HOME/.bashrc" 2>/dev/null; then
    echo "" >> "$HOME/.bashrc"
    cat "$REPO_DIR/config/bashrc.append" >> "$HOME/.bashrc"
    log "Appended config to ~/.bashrc"
else
    log "Shell config already present in ~/.bashrc"
fi

# Source it for this session
source "$HOME/.bashrc" 2>/dev/null || true

# ─── Section 10: Anthropic API key ────────────────────────────────────────────
section "Anthropic API key"

if [ -f "$HOME/.env" ] && grep -q "ANTHROPIC_API_KEY" "$HOME/.env" 2>/dev/null; then
    log "API key already configured in ~/.env"
else
    echo ""
    echo "Enter your Anthropic API key (starts with sk-ant-):"
    echo "(Press Enter to skip — you can add it later to ~/.env)"
    read -r -s API_KEY
    if [ -n "$API_KEY" ]; then
        echo "ANTHROPIC_API_KEY=$API_KEY" > "$HOME/.env"
        chmod 600 "$HOME/.env"
        log "API key saved to ~/.env (chmod 600)"
    else
        warn "Skipped. Add your key later: echo 'ANTHROPIC_API_KEY=sk-ant-...' > ~/.env && chmod 600 ~/.env"
    fi
fi

# ─── Section 11: Git identity ─────────────────────────────────────────────────
section "Git identity"

if git config --global user.name &>/dev/null; then
    log "Git identity: $(git config --global user.name) <$(git config --global user.email)>"
else
    echo ""
    read -rp "Git name (e.g., Your Name): " GIT_NAME
    read -rp "Git email: " GIT_EMAIL

    if [ -n "$GIT_NAME" ] && [ -n "$GIT_EMAIL" ]; then
        git config --global user.name "$GIT_NAME"
        git config --global user.email "$GIT_EMAIL"
        log "Git identity set"
    else
        warn "Skipped. Set later: git config --global user.name '...'"
    fi
fi

# Useful git defaults
git config --global init.defaultBranch main 2>/dev/null || true
git config --global pull.rebase true 2>/dev/null || true

# ─── Section 12: GitHub CLI auth ──────────────────────────────────────────────
section "GitHub CLI auth"

if gh auth status &>/dev/null 2>&1; then
    log "GitHub CLI already authenticated"
else
    warn "GitHub CLI not authenticated."
    echo "  Run: gh auth login"
    echo "  Choose: HTTPS + browser/token"
fi

# ─── Section 13: Summary ──────────────────────────────────────────────────────
section "Setup complete!"

echo ""
echo -e "  ${GREEN}Tools:${NC}     node $(node --version 2>/dev/null || echo 'N/A'), npm $(npm --version 2>/dev/null || echo 'N/A'), gh, tmux, ripgrep, bat"
echo -e "  ${GREEN}Claude:${NC}    $(claude --version 2>/dev/null || echo 'not found — check npm install')"
echo -e "  ${GREEN}Config:${NC}    ~/.tmux.conf, ~/.claude/CLAUDE.md, ~/.claude/skills/"
echo -e "  ${GREEN}Scripts:${NC}   ~/bin/ (new-project, clone-project, agent-run, etc.)"
echo -e "  ${GREEN}Projects:${NC}  ~/projects/"
echo ""
echo "Quick start:"
echo "  new-project my-app           # scaffold a new project"
echo "  clone-project <github-url>   # clone + add agent infra"
echo "  agent-run my-app \"prompt\"     # start headless agent"
echo "  agent-status                  # check all agents"
echo ""
echo "Source your shell to pick up changes:"
echo "  source ~/.bashrc"
echo ""
