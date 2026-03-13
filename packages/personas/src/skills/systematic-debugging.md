# Systematic Debugging

Never guess. Reproduce first, then diagnose.

1. Reproduce the bug reliably — write a failing test if possible
2. Narrow the scope — binary search through the code path
3. Form a hypothesis — what specifically is wrong?
4. Verify the hypothesis — add logging, inspect state
5. Fix the root cause — not the symptom
6. Verify the fix — run the failing test, confirm it passes
7. Check for related issues — did this bug pattern appear elsewhere?

The fix is not complete until you can explain why it was broken.
