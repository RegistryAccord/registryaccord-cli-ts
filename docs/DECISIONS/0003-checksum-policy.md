# 3. Checksum Policy

## Status

Accepted

## Context

The RegistryAccord CLI needs to handle media uploads with checksum verification to ensure data integrity during the upload process.

## Decision

We will use SHA-256 as the checksum algorithm for media uploads with the following policy:

1. **Checksum computation**: Compute SHA-256 hash of the file content before upload
2. **Verification**: Verify server-computed checksum matches client-computed checksum
3. **Abort on mismatch**: Abort the process and report deterministic error on checksum mismatch
4. **Hex encoding**: Use lowercase hex encoding for checksums

### Process

1. Read file and compute SHA-256 hash
2. Initialize upload with CDV service
3. Upload file content to provided URL
4. Finalize upload with checksum verification
5. Compare server checksum with client checksum
6. Report success or abort on mismatch

## Consequences

- **Positive**: SHA-256 provides strong integrity guarantees
- **Positive**: Deterministic error reporting improves user experience
- **Positive**: Hex encoding is human-readable and widely supported
- **Negative**: SHA-256 computation adds processing overhead
- **Negative**: Requires additional round trip for finalization

## Alternatives Considered

1. **MD5**: Faster but cryptographically weaker
2. **SHA-1**: Faster but cryptographically weaker
3. **No verification**: Higher risk of data corruption
4. **Base64 encoding**: Less human-readable than hex

## References

- CLI_REQUIREMENTS.md - Checksums and Media section
