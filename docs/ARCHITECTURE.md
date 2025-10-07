# Architecture

Overview
- oclif-based CLI with commands under src/commands and domain services under src/services.

Modules
- commands: parse flags/args, call services, format output.
- services: crypto, storage, messaging; no CLI parsing.
- lib: shared small utilities (validation, formatting).
- config: load/validate runtime config and file paths.

Growth path
- Add new features as commands or plugins; keep services reusable.
- Introduce plugins for optional domains to decouple release cadence.

Data & IO
- Local key storage as per platform conventions.
- File-based CDV stub in PoC; future messaging/persistence via services.
