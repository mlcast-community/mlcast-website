@AGENTS.md

# Claude Code instructions

`AGENTS.md` is the repository-wide source of truth. Follow it before planning,
editing, reviewing, or running commands. Keep this file lean and place shared
rules in `AGENTS.md` instead of duplicating them here.

## Required workflow

1. Inspect the relevant source files and load only the documentation needed for
   the task.
2. Preserve unrelated user changes and do not assume an existing dirty worktree
   belongs to you.
3. Before making a major change, identify which documentation file must be
   updated using the routing rules in `AGENTS.md`.
4. Make required documentation updates in the same task as the implementation.
   Do not report the work as complete while those documents are stale.
5. Validate proportionally to risk. At minimum, run `git diff --check` and
   inspect the final diff; use runtime/browser validation for behavior or visual
   changes when available.
6. In the final response, summarize the implementation, documentation updated,
   validation performed, and any limitation that prevented full verification.

## Claude-specific guidance

- Use `/memory` when you need to confirm which instruction files were loaded.
- Prefer concise, evidence-backed updates over speculative explanations.
- Ask before destructive actions or meaningful scope expansion.
- If `CLAUDE.md` and `AGENTS.md` appear inconsistent, stop and resolve the
  inconsistency instead of silently choosing one.
