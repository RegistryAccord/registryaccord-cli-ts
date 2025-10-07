# Contributing

Setup
- Node LTS; pnpm or npm; install deps; run build and tests.

Dev workflow
- Scaffold commands with oclif generator; keep command thin; implement service; add tests.
- Run lint/format before committing; update help text and docs.

Testing
- Unit-test services; mock IO; add smoke tests for command entry.

Docs
- Update docs/ARCHITECTURE.md for new modules; add ADRs for major decisions.

Review checklist
- Flags/args validated; errors actionable; --json output stable; no secret logging.
