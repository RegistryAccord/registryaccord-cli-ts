# RegistryAccord CLI Examples

This directory contains ready-to-run scripts that demonstrate various aspects of the RegistryAccord CLI.

## Available Examples

### [demo.sh](demo.sh) - 5-Minute Demo
A complete end-to-end demonstration of the core RegistryAccord protocol flow:
1. Create identity
2. Get session nonce
3. Issue session token
4. Create a post
5. List posts

**Usage:**
```bash
./examples/demo.sh
```

### [identity-example.sh](identity-example.sh) - Identity Management
Demonstrates identity-related commands including creating identities and managing sessions.

**Usage:**
```bash
./examples/identity-example.sh
```

### [content-example.sh](content-example.sh) - Content Management
Shows how to create and list posts, including posts with media attachments.

**Usage:**
```bash
./examples/content-example.sh
```
*Note: Replace `YOUR_DID_HERE` with your actual DID from `identity:create`*

### [discovery-example.sh](discovery-example.sh) - Content Discovery
Examples of feed retrieval, searching, and profile viewing.

**Usage:**
```bash
./examples/discovery-example.sh
```
*Note: Replace `YOUR_DID_HERE` with your actual DID from `identity:create`*

### [demo.ps1](demo.ps1) - PowerShell Demo
A PowerShell version of the 5-minute demo for Windows users.

**Usage:**
```powershell
./examples/demo.ps1
```

## Prerequisites

Before running these examples, ensure you have:
1. Docker and Docker Compose installed
2. The RegistryAccord CLI environment running (`docker-compose up --build -d`)

## Running Examples

All bash scripts can be run directly:

```bash
./examples/demo.sh
```

PowerShell scripts can be run on Windows:

```powershell
./examples/demo.ps1
```
