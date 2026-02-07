# Deploy Skill

Full build verification and deploy pipeline for Ivania Beauty.

## Steps

1. Run `npx tsc --noEmit` and fix any TypeScript errors before proceeding.
2. Run `npx next build` and fix any build errors before proceeding.
3. Run `git status` to review all changed files.
4. Run `git diff` to review the actual changes.
5. Stage only the relevant files (never use `git add .` or `git add -A`).
6. Create a descriptive git commit summarizing the changes.
7. Push to `origin master`.
8. Report the commit hash and confirm the push was successful.

## Rules

- If tsc or build fails, fix the errors FIRST before committing.
- Never commit `.env`, credentials, or secret files.
- Never force push.
- Always include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` in the commit message.
