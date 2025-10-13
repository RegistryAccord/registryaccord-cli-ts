# CLI_REQUIREMENTS.md

## Purpose
- Define Phase 1 requirements for the RegistryAccord CLI (TypeScript) that enables developers to exercise Identity, CDV, and Gateway flows from the terminal.
- Provide a five‑minute, deterministic demo path and scriptable commands for CI and local development via Docker or Node, aligned with protocol specs and devstack.

## Scope
- Implement core commands for identity (create, session), content (post:create, post:list, media upload/finalize), and convenience reads (feed/search/profile).
- Support JSON and human‑readable output, deterministic exit codes, and idempotent operations where applicable.
- Offer two run modes: Dockerized (no local Node install) and native Node (pnpm/npm), both using environment variables for configuration.

## Commands (Phase 1)

### Identity
- `ra identity:create`
  - Generate a new DID (plc) keypair locally; store keys under `~/.registryaccord/key.json` with secure permissions (0700 dir, 0600 file).
  - Output: DID, public key fingerprint, and path to stored key; JSON mode prints machine‑readable fields.
- `ra session:nonce --did <did> --aud <aud>`
  - Fetch a short‑lived nonce from Identity for the given DID and audience.
  - Output: nonce and expiresAt.
- `ra session:issue --did <did> --aud <aud> --nonce <nonce>`
  - Sign the nonce with the local private key; request a JWT from Identity; cache token and expiry under `~/.registryaccord/session.json`.
  - Output: jwt, exp, aud, sub.

### Content (CDV)
- `ra post:create --text "<content>" [--media <path>]`
  - If `--media` is provided: run `uploadInit`, upload to S3 URL, and `finalize` with checksum; include media reference in the post record.
  - Create a record via CDV `POST /v1/repo/record` with enforced schema and author DID from the current session; return `{ uri, cid, indexedAt }`.
- `ra post:list --did <did> [--collection <nsid>] [--limit <n>] [--cursor <c>] [--since <ts>] [--until <ts>]`
  - Page through CDV `GET /v1/repo/listRecords` with deterministic cursors; print as a table or JSON.

### Reads (Gateway, optional Phase 1)
- `ra feed:following --did <viewerDid> [--limit <n>] [--cursor <c>]`
- `ra feed:author --did <authorDid> [--limit <n>] [--cursor <c>]`
- `ra search --q "<query>" [--type post|profile|all] [--limit <n>] [--cursor <c>]`
- `ra profile:get --did <did>`

### Utilities
- `ra whoami` — print current DID and token expiry if a session is active.
- `ra version` — print CLI, API targets, and schema versions in use.
- `ra config` — print effective configuration (redact secrets).

## Output and UX
- Default human‑readable output with concise tables; enable `--json` for machine‑readable outputs.
- Deterministic exit codes:
  - 0 success
  - 2 validation/usage error
  - 3 auth error (missing/expired token, bad audience)
  - 4 network/transport error
  - 5 server error
- Always include a correlationId (if returned by services) in errors; print helpful retry guidance for transient classes.

## Identity and Security
- Keys: store only on the local machine under `~/.registryaccord`; never print private keys.
- Sessions: cache JWT and expiry; refresh via `session:issue` when near expiry; enforce `aud` matching the target service (`cdv`, `gateway`).
- Signing: Ed25519 for nonce signatures; strict verification of issuer/audience by services.

## Configuration
- Environment variables:
  - `RA_IDENTITY_BASE_URL` (e.g., http://localhost:8081)
  - `RA_CDV_BASE_URL` (e.g., http://localhost:8082)
  - `RA_GATEWAY_BASE_URL` (e.g., http://localhost:8083)
  - `RA_ENV` (development|staging|production)
  - `RA_OUTPUT` (table|json)
  - `RA_CDV_MEDIA_BUCKET` (optional for explicit media references)
- Precedence: process env > .env (dev only) > defaults; fail fast on missing required endpoints.

## Files and Permissions
- `~/.registryaccord/key.json` — private key (0600) and public key; directory `~/.registryaccord` must be 0700.
- `~/.registryaccord/session.json` — cached JWTs per audience with expiry and issuer metadata.
- `./.ra/` (project local cache, optional) — pagination cursors or temp files; ignored by VCS via `.gitignore`.

## Checksums and Media
- For `--media`, compute SHA‑256 and upload with correct content type; verify ETag/Content‑MD5 when available.
- On `finalize`, verify the server’s checksum matches the computed value; abort and report mismatch deterministically.

## Pagination
- For list/search/feed commands, accept a `--cursor` and print a `nextCursor` on success.
- Provide `--limit`, `--since`, `--until` where applicable; validate bounds client‑side to reduce server round trips.

## Dockerized Use
- Provide `docker-compose.yml` for CLI‑only runs or integrate with the devstack Compose via profiles.
- Ensure mounts:
  - `~/.registryaccord` → `/home/node/.registryaccord`
  - Optional workspace mount for local files and media paths
- Offer a `Makefile`:
  - `make build` — build CLI image
  - `make ra ARGS="..."` — run arbitrary CLI command
  - `make demo` — execute five‑minute demo script

## Demo (Five Minutes)
1. `ra identity:create`
2. `ra session:nonce --did <did> --aud cdv`
3. `ra session:issue --did <did> --aud cdv --nonce <n>`
4. `ra post:create --text "Hello, sovereign web." [--media ./path.jpg]`
5. `ra post:list --did <did> --limit 10`

Optional:
- `ra feed:author --did <did>`
- `ra search --q "Hello"`

## Error Handling and Retries
- Automatic limited retries (exponential backoff) on 429/503 and certain network errors unless `--no-retry` is set.
- Clear separation between validation errors (exit 2) and server errors (exit 5).
- Redact tokens from logs and error messages.

## Testing
- Unit tests (Vitest) for crypto, storage, config, API clients, and checksum routines.
- Command smoke tests for identity:create, session, post:create/list with a mocked or local devstack back end.
- Coverage target: ≥80% on core modules.

## CI/CD
- CI pipeline:
  - Lint (ESLint), typecheck (TypeScript), unit tests (Vitest), smoke tests (optional with devstack)
  - Build artifact: Docker image + npm package (optional), SBOM generation
- Semver tagging and changelog; publish Docker image on tagged releases.

## Documentation
- README: quickstart for Docker and Node; examples for each command; JSON samples; troubleshooting.
- Examples directory: ready‑to‑run scripts (bash/PowerShell) for demo commands.
- DECISIONS (ADRs): key storage format, output conventions, checksum policy, retry strategy.

## Acceptance Criteria (Phase 1)
- The five‑minute demo completes successfully against devstack with deterministic outputs.
- Commands return deterministic exit codes; `--json` provides machine‑readable outputs for CI.
- Identity sessions interoperate with CDV; media finalize verifies checksums correctly.
- Unit coverage ≥80% on core codepaths; CI green with a built Docker image and signed artifacts (if signing is adopted).
