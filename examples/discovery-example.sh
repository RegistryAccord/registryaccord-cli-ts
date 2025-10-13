#!/bin/bash

# RegistryAccord CLI - Content Discovery Example
# This script demonstrates discovery-related commands

set -e  # Exit on any error

echo "=== RegistryAccord CLI - Content Discovery Example ==="

echo "\n1. Getting your feed..."
docker-compose run --rm ra feed:following --did "YOUR_DID_HERE" --limit 10

echo "\n2. Getting posts by a specific author..."
docker-compose run --rm ra feed:author --did "YOUR_DID_HERE" --limit 10

echo "\n3. Searching for content..."
docker-compose run --rm ra search --q "RegistryAccord" --type post --limit 5

echo "\n4. Getting a profile..."
docker-compose run --rm ra profile:get --did "YOUR_DID_HERE"

echo "\n=== Content discovery example completed ==="
echo "Note: Replace YOUR_DID_HERE with your actual DID from identity:create"
