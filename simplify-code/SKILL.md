---
name: simplify-code
description: "Review a git diff or explicit file scope for reuse, code quality, efficiency, clarity, and standards issues, then optionally apply safe Codex-driven fixes. Use when the user asks to \"simplify code\", \"review changed code\", \"check for code reuse\", \"review code quality\", \"review efficiency\", \"simplify changes\", \"clean up code\", \"refactor changes\", or \"run simplify\"."
---

# Simplify Code

Review changed code for reuse, quality, efficiency, and clarity issues. Apply only high-confidence, behavior-preserving fixes unless the user explicitly wants review only.

## Modes

Choose the mode from the user's request:

- `review-only`: user asks to review, audit, or check the changes
- `safe-fixes`: user asks to simplify, clean up, or refactor the changes
- `fix-and-validate`: same as `safe-fixes`, but also run the smallest relevant validation after edits

If the user does not specify, default to:

- `review-only` for "review", "audit", or "check"
- `safe-fixes` for "simplify", "clean up", or "refactor"

## Step 1: Define Scope

Prefer this scope order:

1. Files or paths explicitly named by the user
2. Current git changes
3. Files edited earlier in the current Codex turn
4. Most recently modified tracked files, only if the user asked for a review but there is no diff

If there is no clear scope, stop and say so briefly.

When using git changes, determine the smallest correct diff command based on the repo state:

- unstaged work: `git diff`
- staged work: `git diff --cached`
- branch or commit comparison explicitly requested by the user: use that exact diff target
- mixed staged and unstaged work: review both

Do not assume `git diff HEAD` is the right default when a smaller diff is available.

## Step 2: Load Local Instructions

Before reviewing standards or applying fixes, read the repo's local instruction files and relevant project docs for the touched area. Prefer the closest applicable guidance, such as:

- `AGENTS.md`
- repo workflow docs
- architecture or style docs for the touched module

Use those instructions to interpret what counts as a real issue versus an intentional local pattern.

## Step 3: Decide Review Shape

Use the smallest review shape that matches the scope:

- Tiny scope: review locally
  Use this for one small file or a small diff where parallel review would add overhead.
- Medium scope: split the review into two lanes
  For example, one lane for reuse and quality, one lane for efficiency and clarity.
- Large scope: run multiple Codex review lanes in parallel
  Use this when the diff spans multiple files or concerns and parallel review will materially reduce latency.

If parallel review is used, each review lane should inspect the same scope but focus on one responsibility. Keep prompts narrow and request concise, structured findings only.

## Step 4: Run the Review

Review the scoped changes using these categories.

### Reuse

- Search for existing helpers, utilities, or shared abstractions that already solve the same problem.
- Flag duplicated functions or near-duplicate logic introduced in the change.
- Flag inline logic that should call an existing helper instead of re-implementing it.

### Code Quality

- Redundant state, cached values, or derived values stored unnecessarily
- Parameter sprawl caused by threading new arguments through existing call chains
- Copy-paste with slight variation that should become a shared abstraction
- Leaky abstractions or ownership violations across module boundaries
- Stringly-typed values where existing typed contracts, enums, or constants already exist

### Efficiency

- Repeated work, duplicate reads, duplicate API calls, or unnecessary recomputation
- Sequential work that could safely run concurrently
- New work added to startup, render, request, or other hot paths without clear need
- Pre-checks for existence when the operation itself can be attempted directly and errors handled
- Memory growth, missing cleanup, or listener/subscription leaks
- Overly broad reads or scans when the code only needs a subset

### Clarity and Standards

- Violations of local project conventions or module patterns
- Unnecessary complexity, deep nesting, weak names, or redundant comments
- Overly compact or clever code that reduces readability
- Over-simplification that collapses separate concerns into one unclear unit
- Dead code, dead abstractions, or indirection without value

Only report issues that materially improve maintainability, correctness, or cost. Do not churn code just to make it look different.

## Step 5: Return Structured Findings

Whether reviewing locally or in parallel, normalize findings into this shape:

1. File and line or nearest symbol
2. Category: reuse, quality, efficiency, or clarity
3. Why it is a problem
4. Recommended fix
5. Confidence: high, medium, or low

Discard weak or duplicative findings before editing.

## Step 6: Apply Fixes Carefully

In `review-only` mode, stop after reporting findings.

In `safe-fixes` or `fix-and-validate` mode:

- Apply only high-confidence, behavior-preserving fixes
- Skip subjective refactors that need product or architectural judgment
- Preserve local patterns when they are intentional or instruction-backed
- Keep edits scoped to the reviewed files unless a small adjacent change is required to complete the fix correctly

Prefer fixes like:

- replacing duplicated code with an existing helper
- removing redundant state or dead code
- simplifying control flow without changing behavior
- narrowing overly broad operations
- renaming unclear locals when the scope is contained

Do not stage, commit, or push changes as part of this skill.

## Step 7: Validate When Required

In `fix-and-validate` mode, run the smallest relevant validation for the touched scope after edits.

Examples:

- targeted tests for the touched module
- typecheck or compile for the touched target
- formatter or lint check if that is the project's real safety gate

Prefer fast, scoped validation over full-suite runs unless the change breadth justifies more.

If validation is skipped because the user asked not to run it, say so explicitly.

## Step 8: Summarize Outcome

Close with a brief result:

- what was reviewed
- what was fixed, if anything
- what was intentionally left alone
- whether validation ran

If the code is already clean for this rubric, say that directly instead of manufacturing edits.
