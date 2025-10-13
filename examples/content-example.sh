#!/bin/bash

# RegistryAccord CLI - Content Management Example
# This script demonstrates content-related commands

set -e  # Exit on any error

echo "=== RegistryAccord CLI - Content Management Example ==="

echo "\n1. Creating a post without media..."
docker-compose run --rm ra post:create --text "This is a simple post without media." --did "YOUR_DID_HERE"

echo "\n2. Creating a post with media (if you have an image file)..."
echo "# docker-compose run --rm ra post:create --text \"Check out this image!\" --media ./photo.jpg --did \"YOUR_DID_HERE\""

echo "\n3. Listing posts..."
docker-compose run --rm ra post:list --did "YOUR_DID_HERE" --limit 5

echo "\n=== Content management example completed ==="
echo "Note: Replace YOUR_DID_HERE with your actual DID from identity:create"
