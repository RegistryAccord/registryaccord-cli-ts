# Architectural Decision Records (ADRs)

This directory contains Architectural Decision Records that document the key design choices made during the development of the RegistryAccord CLI.

## What are ADRs?

ADRs are short text documents that capture an important architectural decision made along with its context and consequences.

## Format

We follow the format described in [Documenting Architecture Decisions](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) by Michael Nygard.

Each ADR has the following structure:

1. **Title**: Descriptive title of the decision
2. **Status**: Proposed, Accepted, Superseded, etc.
3. **Context**: What is the issue that we're seeing?
4. **Decision**: What is the change that we're proposing?
5. **Consequences**: What becomes easier or more difficult to do because of this change?

## Index of ADRs

1. [Key Storage Format](0001-key-storage-format.md)
2. [Output Conventions](0002-output-conventions.md)
3. [Checksum Policy](0003-checksum-policy.md)
4. [Retry Strategy](0004-retry-strategy.md)

## Creating New ADRs

When adding a new ADR:

1. Copy the template from [ADR Template](../TEMPLATES/ADR_TEMPLATE.md)
2. Number sequentially (0005, 0006, etc.)
3. Use present tense and imperative mood in the title
4. Focus on a single decision per ADR
5. Include sufficient context for future readers
