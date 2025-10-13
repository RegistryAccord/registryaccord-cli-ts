# 1. Key Storage Format

## Status

Accepted

## Context

The RegistryAccord CLI needs to store cryptographic keys locally for identity management. We need to decide on a secure and interoperable format for storing these keys.

## Decision

We will store keys in a JSON file at `~/.registryaccord/key.json` with the following structure:

```json
{
  "did": "did:plc:example",
  "publicKeyBase64": "base64-encoded-public-key",
  "secretKeyBase64": "base64-encoded-secret-key"
}
```

The file will have permissions set to 0600 (read/write for owner only), and the directory will have permissions set to 0700 (read/write/execute for owner only).

## Consequences

- **Positive**: Simple JSON format that's easy to parse and generate
- **Positive**: Base64 encoding ensures safe storage and transmission
- **Positive**: Secure file permissions protect keys from unauthorized access
- **Negative**: Base64 encoding increases file size by ~33% compared to binary
- **Negative**: JSON parsing has some overhead compared to binary formats

## Alternatives Considered

1. **Binary format**: More compact but harder to debug and less portable
2. **PEM format**: Standard for cryptographic keys but more complex to parse
3. **Encrypted storage**: Adds security but requires password management

## References

- CLI_REQUIREMENTS.md - Identity and Security section
