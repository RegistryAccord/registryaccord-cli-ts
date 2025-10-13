# Makefile

# Build the CLI Docker image
build:
	docker-compose build ra

# Run an arbitrary CLI command
ra: build
	docker-compose run --rm ra $(ARGS)

# Execute the five-minute demo script
.PHONY: demo
demo: build
	@echo "=== RegistryAccord CLI 5-Minute Demo ==="
	@echo "\n1. Creating identity..."
	docker-compose run --rm ra identity:create
	
	@echo "\n2. Getting session nonce..."
	@read -p "Enter your DID from step 1: " did && \
	docker-compose run --rm ra session:nonce --did $$did --aud cdv
	
	@echo "\n3. Issuing session token..."
	@read -p "Enter your DID: " did && \
	@read -p "Enter nonce from step 2: " nonce && \
	docker-compose run --rm ra session:issue --did $$did --aud cdv --nonce $$nonce
	
	@echo "\n4. Creating a post..."
	@read -p "Enter your DID: " did && \
	docker-compose run --rm ra post:create --text "Hello, sovereign web." --did $$did
	
	@echo "\n5. Listing posts..."
	@read -p "Enter your DID: " did && \
	docker-compose run --rm ra post:list --did $$did --limit 10
	
	@echo "\n=== Demo Complete ==="

# Install dependencies
install:
	npm install

# Run tests
test:
	npm test

# Run tests in watch mode
test-watch:
	npm run test:watch

# Lint code
lint:
	npm run lint

# Build TypeScript
build-ts:
	npm run build
