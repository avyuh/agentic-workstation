# Fix From Test (TDD)

When fixing a bug or adding a feature, write the failing test first.

## Steps

1. **Understand the bug / requirement.** Read the relevant code. Identify the exact behavior that's wrong or missing.

2. **Write a failing test** that captures the expected behavior:
   - The test should fail for the RIGHT reason (the bug / missing feature)
   - Keep it minimal — test one thing
   - Use descriptive test names: `test_returns_error_when_user_not_found`

3. **Run the test. Confirm it fails.** If it passes, your test doesn't capture the issue — rewrite it.

4. **Fix the code.** Make the minimal change needed to make the test pass. Don't refactor, don't improve adjacent code.

5. **Run verify_fast.sh.** All tests should pass, including the new one.

6. **Review the fix.** Is it the right fix, or a workaround? Would you be comfortable with this in production?

7. **Run full verify.sh** to check for regressions.

## Why Test First
- Proves the bug is real and reproducible before you touch anything
- Defines "done" precisely — the test passes
- Prevents fixing the wrong thing (common with agents)
- The test becomes a regression guard forever
