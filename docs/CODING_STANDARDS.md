# Coding Standards

TypeScript
- Target ES2022, ESM; strict true; no implicit any; no default exports for commands.

Errors
- Validate early; provide user-actionable messages; non-zero exit on failure.
- Services return typed errors or throw domain errors; commands map to exit codes.

Logging & Output
- Human-readable default; add --json for tools; stable key names and shapes.
- Use --verbose for debug details; avoid console noise.

Structure
- Commands thin, services thick; no business logic in command files.
- Shared flags/constants in a single module to avoid drift.

Security
- Never log secrets; check file perms where feasible; sanitize inputs.

Testing
- Unit tests for services; command smoke tests; mock external IO.

Docs
- Keep help text accurate; update examples with each change.
