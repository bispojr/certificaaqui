# Copilot Instructions for this Repository

These instructions define how AI assistants should behave when generating, editing, or reviewing code in this repository.

Always prioritize these instructions over generic coding suggestions.

---

# Language Rules

- Chat explanations must be written in **Portuguese (pt-BR)**.
- Commit messages must be written in **Portuguese (pt-BR)**.
- Code, identifiers, and technical terminology should remain **in English**.

---

# Time and Date Rules

Whenever adding timestamps or completion dates (for example when marking tasks as completed in `docs/backlog.md`), always use the **real current time** in the Brasília time zone.

Timezone specification:

- Timezone name: Brasília Standard Time
- IANA identifier: America/Sao_Paulo
- UTC Offset: UTC-03:00

## How to obtain the timestamp

The timestamp MUST reflect the **actual moment the task was completed**.

Before writing a timestamp, always obtain the current date and time from the **operating system**.

Never:

- invent timestamps
- estimate timestamps
- reuse timestamps from examples
- assume the current time

Always retrieve the time from the system using a command such as:

```
date
```

or an equivalent command that returns the current system time.

## Formatting rule

Use the following format when updating the backlog:

```
YYYY-MM-DD HH:mm (BRT)
```

Example:

```
- [x] Implement authentication middleware — completed on 2026-03-14 10:42 (BRT)
```

## Important rule

If the real system time cannot be obtained, **do not add a timestamp** until the actual time can be retrieved.

Additionally:

- Every backlog item marked as `[x]` **must include a timestamp**.
- Do not mark backlog items as completed without recording the completion time using the format above.

---

# Project Source of Truth

Before making any change, ALWAYS read and consider:

- `docs/especificacoes.md`
- `docs/backlog.md`

These files define the expected behavior of the system and the list of pending tasks.

Rules:

- `especificacoes.md` defines **what the system must do**.
- `backlog.md` defines **what still needs to be implemented or improved**.

Never implement features that contradict these documents.

---

# Development Workflow

Every code modification MUST follow this workflow.

## 1. Evaluate the Need for Tests

Before modifying or adding code, determine whether a **test should be created or updated**.

If a test is appropriate, follow this process:

1. Create a **specific test that covers the intended change**.
2. Run **only this specific test**.
3. If the test fails:
   - Fix the implementation incrementally
   - Repeat until the test passes.
4. Run the **full test suite** using:

`npm run check`

5. If any test fails:
   - Fix the issues incrementally
   - Repeat until all tests pass.

Never introduce changes that break the full test suite.

---

# Backlog Synchronization

After implementing a change, check the file:

`docs/backlog.md`


If the implemented work corresponds to a backlog item:

- Mark it as completed using:

`[x]`


Example:
- [x] Implementar feature X ✅ (13/03/2026, 14:00, BRT)


Do not mark items as completed unless the implementation is actually finished.

---

# Next Step Suggestion

After completing a task, always:

1. Re-read `docs/backlog.md`
2. Identify the **most logical next step**
3. Suggest the next task that should be implemented.

The suggestion should prioritize:

1. Dependencies required by other tasks
2. Core system functionality
3. Tasks already partially implemented

---

# Testing Philosophy

Prefer:

- small tests
- isolated tests
- deterministic tests

Avoid:

- tests with hidden dependencies
- tests that rely on execution order
- tests that depend on external services

---

# Code Quality Guidelines

When generating or modifying code:

- Prefer **small and focused functions**
- Avoid unnecessary abstractions
- Follow the existing project structure
- Maintain consistency with existing code

---

# Safety Rules

Never:

- Remove tests without a strong justification
- Introduce breaking changes without updating tests
- Ignore the backlog or specifications
