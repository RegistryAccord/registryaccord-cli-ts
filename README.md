# RegistryAccord CLI

The official Proof of Concept (PoC) Command Line Interface (CLI) for the RegistryAccord protocol.

-----

### What is This?

This repository contains the source code for the official CLI for the RegistryAccord protocol. This tool allows developers to interact with the core functions of the protocol, such as creating identities, managing sessions, and publishing content, directly from the terminal.

### Documentation

- README: quickstart for Docker and Node; examples for each command; JSON samples; troubleshooting.
- Examples directory: ready‑to‑run scripts (bash/PowerShell) for demo commands. See [examples/README.md](examples/README.md) for details.
- DECISIONS (ADRs): Architectural Decision Records documenting key design choices. See [docs/DECISIONS/](docs/DECISIONS/) for details.

### Current Status

This CLI implements Phase 1 requirements for the RegistryAccord protocol, providing a complete set of commands for identity management, content creation, and content discovery.

### Prerequisites

Before you begin, you must have the following installed on your system:

  * Docker
  * Docker Compose

-----

### Getting Started (Quickstart)

This project uses Docker to provide a self-contained, one-command setup. You do not need to install Node.js or TypeScript locally.

**1. Clone the repository:**

```bash
git clone https://github.com/registryaccord/registryaccord-cli-ts.git
cd registryaccord-cli-ts
```

**2. Start the local development environment:**

This single command will build the CLI image and start the local services it depends on.

```bash
docker-compose up --build -d
```

**3. Run the CLI:**

You can now run any `ra` command using the `docker-compose run` wrapper.

```bash
docker-compose run --rm ra --help
```

*Note: We use `ra` as a short alias for `registryaccord`.*

-----

### Usage & Available Commands

#### **Identity Management**

##### **`ra identity:create`**

Generate a new DID (plc) keypair locally; store keys under `~/.registryaccord/key.json` with secure permissions.

**Usage:**

```bash
docker-compose run --rm ra identity:create
```

##### **`ra session:nonce --did <did> --aud <aud>`**

Fetch a short-lived nonce from Identity for the given DID and audience.

**Usage:**

```bash
docker-compose run --rm ra session:nonce --did did:plc:12345 --aud cdv
```

##### **`ra session:issue --did <did> --aud <aud> --nonce <nonce>`**

Sign the nonce with the local private key; request a JWT from Identity; cache token and expiry under `~/.registryaccord/session.json`.

**Usage:**

```bash
docker-compose run --rm ra session:issue --did did:plc:12345 --aud cdv --nonce abc123
```

#### **Content Management**

##### **`ra post:create --text "<content>" [--media <path>] --did <did>`**

Create a record via CDV with enforced schema and author DID from the current session.

**Usage:**

```bash
docker-compose run --rm ra post:create --text "Hello, RegistryAccord!" --did did:plc:12345
```

With media:

```bash
docker-compose run --rm ra post:create --text "Check out this image!" --media ./photo.jpg --did did:plc:12345
```

##### **`ra post:list --did <did> [--collection <nsid>] [--limit <n>] [--cursor <c>] [--since <ts>] [--until <ts>]`**

Page through CDV records with deterministic cursors.

**Usage:**

```bash
docker-compose run --rm ra post:list --did did:plc:12345 --limit 10
```

#### **Content Discovery**

##### **`ra feed:following --did <viewerDid> [--limit <n>] [--cursor <c>]`**

Get feed of posts from followed users.

**Usage:**

```bash
docker-compose run --rm ra feed:following --did did:plc:12345 --limit 20
```

##### **`ra feed:author --did <authorDid> [--limit <n>] [--cursor <c>]`**

Get feed of posts by a specific author.

**Usage:**

```bash
docker-compose run --rm ra feed:author --did did:plc:12345 --limit 20
```

##### **`ra search --q "<query>" [--type post|profile|all] [--limit <n>] [--cursor <c>]`**

Search for posts, profiles, or content.

**Usage:**

```bash
docker-compose run --rm ra search --q "RegistryAccord" --type post --limit 10
```

##### **`ra profile:get --did <did>`**

Get profile information for a DID.

**Usage:**

```bash
docker-compose run --rm ra profile:get --did did:plc:12345
```

#### **Utilities**

##### **`ra whoami`**

Print current DID and token expiry if a session is active.

**Usage:**

```bash
docker-compose run --rm ra whoami
```

##### **`ra version`**

Print CLI, API targets, and schema versions in use.

**Usage:**

```bash
docker-compose run --rm ra version
```

##### **`ra config`**

Print effective configuration (redact secrets).

**Usage:**

```bash
docker-compose run --rm ra config
```

##### **`ra --json`**

Enable JSON output for machine-readable outputs.

**Usage:**

```bash
docker-compose run --rm ra post:list --did did:plc:12345 --json
```

-----

### Example Workflow (5-Minute Demo)

This demonstrates the core "happy path" of the protocol:

1.  **Create your identity:**
    ```bash
    docker-compose run --rm ra identity:create
    ```
2.  **Get a session nonce:**
    ```bash
    docker-compose run --rm ra session:nonce --did YOUR_DID --aud cdv
    ```
3.  **Issue a session token:**
    ```bash
    docker-compose run --rm ra session:issue --did YOUR_DID --aud cdv --nonce YOUR_NONCE
    ```
4.  **Create a post:**
    ```bash
    docker-compose run --rm ra post:create --text "Hello, sovereign web." --did YOUR_DID
    ```
5.  **List your posts:**
    ```bash
    docker-compose run --rm ra post:list --did YOUR_DID --limit 10
    ```

For a ready-to-run version of this demo, see [examples/demo.sh](examples/demo.sh).
Additional examples for specific command categories are available in the [examples](examples/) directory.

### Learn More

For more information on the vision, architecture, and economic model of the protocol, please visit our main documentation site and read our litepaper.

  * **Public Docs Site:** [https://www.registryaccord.com](https://www.google.com/search?q=https://www.registryaccord.com)
  * **Protocol Specifications:** [https://github.com/registryaccord/registryaccord-specs](https://www.google.com/search?q=https://github.com/registryaccord/registryaccord-specs)

### Contributing

We welcome feedback and contributions! Please see our main contribution guidelines and Code of Conduct in the `registryaccord-specs` repository.

### Docker usage (standalone image)

If you prefer not to use docker-compose, you can build and run the CLI as a single Docker image:

1. Build the image

```bash
docker build -t registryaccord-cli .
```

2. Run commands

```bash
docker run --rm registryaccord-cli --help
```

### Makefile Commands

The project includes a Makefile with convenient commands:

```bash
make build     # Build the CLI Docker image
make ra ARGS="..."  # Run arbitrary CLI command
make demo      # Execute the five-minute demo script
make test      # Run unit tests
make lint      # Lint the code
```

### Testing

Run unit tests with Vitest:

```bash
npm test
```

### Security

- Keys are stored only on the local machine under `~/.registryaccord` with secure permissions
- Sessions are cached with expiry information
- Commands avoid logging secrets/private keys
- Use `--json` for machine-readable outputs; avoid sharing raw secret material

### License

This project is licensed under the MIT License.
