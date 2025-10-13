#!/bin/bash

# RegistryAccord CLI - Identity Management Example
# This script demonstrates identity-related commands

set -e  # Exit on any error

echo "=== RegistryAccord CLI - Identity Management Example ==="

echo "\n1. Creating a new identity..."
docker-compose run --rm ra identity:create

echo "\n2. Checking current session..."
docker-compose run --rm ra whoami

echo "\n3. Viewing configuration..."
docker-compose run --rm ra config

echo "\n=== Identity management example completed ==="
