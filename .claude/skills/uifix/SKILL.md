# UI Fix Skill

Structured workflow for fixing visual/UI issues without introducing regressions.

## Before ANY edits

1. **Clarify the problem:** Ask the user to describe:
   - What they see (current behavior)
   - What they expect (desired behavior)
   - Whether it's a CSS issue, content issue, layout issue, or something else
2. **Identify affected files:** Use Grep/Glob to find all files involved. List them.
3. **Explain the fix plan:** State:
   - What you think the root cause is
   - Exactly which files you'll modify
   - What could break as a side effect
4. **Wait for user approval** before making any edits.

## During edits

- Change ONLY the minimum CSS/JSX needed to fix the issue.
- Do NOT refactor, rename, or "improve" surrounding code.
- Do NOT touch animations unless the user explicitly asks.
- After each edit, describe what the visual result should look like so the user can verify.

## After edits

- Run `npx tsc --noEmit` to verify no type errors were introduced.
- Summarize what changed and what the user should check visually.
