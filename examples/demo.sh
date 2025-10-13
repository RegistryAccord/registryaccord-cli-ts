#!/bin/bash

# RegistryAccord CLI - 5-Minute Demo Script
# This script demonstrates the core "happy path" of the protocol

set -e  # Exit on any error

echo "=== RegistryAccord CLI - 5-Minute Demo ==="

echo "\n1. Creating identity..."
IDENTITY_OUTPUT=$(docker-compose run --rm ra identity:create)
echo "$IDENTITY_OUTPUT"

# Extract DID from the output
DID=$(echo "$IDENTITY_OUTPUT" | grep "DID:" | cut -d' ' -f2)
echo "\nExtracted DID: $DID"

echo "\n2. Getting session nonce..."
NONCE_OUTPUT=$(docker-compose run --rm ra session:nonce --did "$DID" --aud cdv)
echo "$NONCE_OUTPUT"

# Extract nonce from the output
NONCE=$(echo "$NONCE_OUTPUT" | grep "Nonce:" | cut -d' ' -f2)
echo "\nExtracted nonce: $NONCE"

echo "\n3. Issuing session token..."
SESSION_OUTPUT=$(docker-compose run --rm ra session:issue --did "$DID" --aud cdv --nonce "$NONCE")
echo "$SESSION_OUTPUT"

echo "\n4. Creating a post..."
POST_OUTPUT=$(docker-compose run --rm ra post:create --text "Hello, sovereign web." --did "$DID")
echo "$POST_OUTPUT"

echo "\n5. Listing posts..."
LIST_OUTPUT=$(docker-compose run --rm ra post:list --did "$DID" --limit 10)
echo "$LIST_OUTPUT"

echo "\n=== Demo completed successfully! ==="
