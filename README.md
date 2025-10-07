# RegistryAccord CLI

The official Proof of Concept (PoC) Command Line Interface (CLI) for the RegistryAccord protocol.

-----

### What is This?

This repository contains the source code for the official CLI for the RegistryAccord protocol. This tool allows developers to interact with the core functions of the protocol, such as creating identities and publishing content, directly from the terminal.

### Current Status

This CLI is an early-stage **Proof of Concept** built to validate the core technical ideas of the protocol. It is intended for early developers and advisors for feedback and is **not production-ready**. The primary goal is to provide a tangible way to "touch and feel" the protocol's core concepts of sovereign identity and content ownership.

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

This single command will build the CLI image and start the local services it depends on (a minimal CDV stub, a database, and a NATS message bus).

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

Here are the core commands available in the PoC:

#### **`ra identity:create`**

Creates a new self-sovereign identity. This generates a cryptographic keypair and saves it locally to a mounted volume (`~/.registryaccord/key.json`).

**Usage:**

```bash
docker-compose run --rm ra identity:create
```

#### **`ra post:create [TEXT]`**

Creates and signs a new post with your identity. The post is saved to your local Creator Data Vault (CDV) stub (`cdv.json`).

**Usage:**

```bash
docker-compose run --rm ra post:create "This is my first post on the RegistryAccord protocol."
```

#### **`ra post:list`**

Lists all posts from your local CDV and verifies their signatures against your public key.

**Usage:**

```bash
docker-compose run --rm ra post:list
```

-----

### Example Workflow (5-Minute Demo)

This demonstrates the core "happy path" of the protocol:

1.  **Create your identity:**
    ```bash
    docker-compose run --rm ra identity:create
    # Output will show your new DID and that your key has been saved.
    ```
2.  **Create your first post:**
    ```bash
    docker-compose run --rm ra post:create "Hello, sovereign web."
    # Output will confirm the post was created and signed.
    ```
3.  **Create a second post:**
    ```bash
    docker-compose run --rm ra post:create "Content ownership is the future."
    ```
4.  **List and verify your content:**
    ```bash
    docker-compose run --rm ra post:list
    # Output will show both of your posts with a checkmark indicating the signatures are valid.
    ```

### Learn More

For more information on the vision, architecture, and economic model of the protocol, please visit our main documentation site and read our litepaper.

  * **Public Docs Site:** [https://www.registryaccord.com](https://www.google.com/search?q=https://www.registryaccord.com)
  * **Protocol Specifications:** [https://github.com/registryaccord/registryaccord-specs](https://www.google.com/search?q=https://github.com/registryaccord/registryaccord-specs)

### Contributing

This project is in an early, formative stage. We welcome feedback and contributions\! Please see our main contribution guidelines and Code of Conduct in the `registryaccord-specs` repository.

### License

This project is licensed under the MIT License.
