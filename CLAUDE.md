# Ivania Beauty - Claude Code Instructions

Primary instructions live in `AGENTS.md` and `.agents/` files.

## Environment

- **OS:** Windows 11. Always use Windows-compatible paths (backslashes or forward slashes that work in Git Bash). Never use Unix-only paths like `/tmp/` or Unix-only commands without checking compatibility first.
- **Shell:** Git Bash on Windows. PowerShell and cmd are also available.
- **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4.
- **Backend:** Firebase Admin SDK (Firestore, Auth, Storage).
- **Deploy target:** Vercel.
- **Package manager:** npm.

## General Rules

- When the user requests a specific change (reorder tabs, remove a filter, rename something), implement it on the FIRST attempt. Do not defer, skip, or "plan to do it later."
- Follow `AGENTS.md` as the default rule set. If a subfolder contains a more specific agent file, that file takes precedence.
- Always use Next.js App Router conventions. Never start with static HTML/CSS/JS unless explicitly asked.

## Bug Fixing Rules

- When fixing bugs, do NOT modify unrelated code.
- Before submitting a fix, verify that existing functionality still works.
- If you touch a component, re-check its imports, state variables, and dependent components for regressions.
- Break complex fixes into smaller, individually verified steps.
- Prefer explaining a fix plan and listing affected files before editing.

## UI / Visual Changes

- When the user describes a visual/UI issue (e.g., "black bars", "misaligned", "too big"), ask clarifying questions about the root cause before attempting a fix.
- Do not assume you understand the visual problem — confirm whether it's a container issue, content issue, padding issue, CSS issue, etc.
- Test visual changes by describing what you expect the result to look like, so the user can confirm before you iterate further.

## Quick Commands

- `npm run dev` — local development
- `npm run build` — production build (`npx next build`)
- `npx tsc --noEmit` — typecheck
- `npm run lint` — lint
