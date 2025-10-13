# RegistryAccord CLI - 5-Minute Demo Script (PowerShell)
# This script demonstrates the core "happy path" of the protocol

Write-Host "=== RegistryAccord CLI - 5-Minute Demo ===" -ForegroundColor Green

Write-Host "`n1. Creating identity..." -ForegroundColor Yellow
$identityOutput = docker-compose run --rm ra identity:create
Write-Host $identityOutput

# Extract DID from the output
$did = ($identityOutput | Select-String "DID:").Line.Split(" ")[1]
Write-Host "`nExtracted DID: $did" -ForegroundColor Cyan

Write-Host "`n2. Getting session nonce..." -ForegroundColor Yellow
$nonceOutput = docker-compose run --rm ra session:nonce --did $did --aud cdv
Write-Host $nonceOutput

# Extract nonce from the output
$nonce = ($nonceOutput | Select-String "Nonce:").Line.Split(" ")[1]
Write-Host "`nExtracted nonce: $nonce" -ForegroundColor Cyan

Write-Host "`n3. Issuing session token..." -ForegroundColor Yellow
$sessionOutput = docker-compose run --rm ra session:issue --did $did --aud cdv --nonce $nonce
Write-Host $sessionOutput

Write-Host "`n4. Creating a post..." -ForegroundColor Yellow
$postOutput = docker-compose run --rm ra post:create --text "Hello, sovereign web." --did $did
Write-Host $postOutput

Write-Host "`n5. Listing posts..." -ForegroundColor Yellow
$listOutput = docker-compose run --rm ra post:list --did $did --limit 10
Write-Host $listOutput

Write-Host "`n=== Demo completed successfully! ===" -ForegroundColor Green
