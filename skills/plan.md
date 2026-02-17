# Planning with Files

Before writing any code, create a plan and track progress in files.

## Steps

1. **Research**: Read relevant code, docs, and tests to understand the current state. Don't skim — actually understand the architecture.

2. **Create task_plan.md** in the project root:
   ```markdown
   # Task: [objective]

   ## Context
   [What exists now, what needs to change, why]

   ## Approach
   [Numbered steps, each independently verifiable]

   ## Files to Modify
   [List every file you expect to touch]

   ## Risk / Open Questions
   [Anything uncertain — surface it here, don't bury it]

   ## Success Criteria
   [How we know it's done — specific, testable]
   ```

3. **Create progress.md** (or update existing):
   ```markdown
   # Progress

   ## Done
   - (nothing yet)

   ## In Progress
   - Step 1: [description]

   ## Next
   - Step 2: [description]
   - Step 3: [description]

   ## Blocked
   - (nothing)
   ```

4. **Execute step by step.** After each step:
   - Run verify_fast.sh
   - Update progress.md (move item from Next → In Progress → Done)
   - If something unexpected comes up, add it to progress.md under Blocked

5. **When done**: Run full verify.sh. Update progress.md to reflect final state.

## Why This Works
- The plan survives context window compression
- Progress.md lets you (and humans) see where you are at any point
- Surfacing risks early prevents silent wrong turns
