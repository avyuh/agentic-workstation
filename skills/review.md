# Self-Review Before Completing

Before declaring a task done, review your own work against this checklist.

## Checklist

1. **Re-read the original objective.** Does what you built actually match what was asked? Not what you interpreted — what was asked.

2. **Run verify.sh.** Not verify_fast — the full suite. If it fails, you're not done.

3. **Check the diff.** Run `git diff` and read every changed line. Look for:
   - Debugging artifacts (console.log, TODO comments, hardcoded values)
   - Unintended changes to files you didn't mean to touch
   - Deleted code that shouldn't have been deleted
   - Missing error handling at system boundaries

4. **Check for scope creep.** Did you change anything beyond what was required? Revert unnecessary changes.

5. **Test the unhappy path.** Think of 2-3 ways this could fail (bad input, missing data, network error). Are those handled?

6. **Read the code as a stranger.** Would someone seeing this for the first time understand it without explanation? If not, add a comment explaining *why* (not *what*).

7. **Update docs if needed.** If you changed behavior, does architecture.md or conventions.md need updating?

## If You Find Issues
Fix them. Then run this checklist again. Don't ship known problems.
