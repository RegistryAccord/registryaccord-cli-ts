# AI Guide

Goals
- Maintain an oclif TS CLI with clean separation: commands (thin) -> services (logic) -> lib (helpers).

When adding a command
- Use oclif generator; create a service that encapsulates logic; wire flags/args; add --json where applicable.

Constraints
- ESM TS, strict mode.
- No secret logging; keys stored under platform-appropriate app data dirs.
- Prefer pure functions in lib.

Testing
- Unit-test services with mocks for FS/network.
- Add smoke tests for command entry paths.

Docs
- Update help text, examples, and docs/ARCHITECTURE.md.
- Record major choices in docs/DECISIONS/*.md.

Style
- Descriptive names, early validation, concise outputs, stable JSON shape with --json.
