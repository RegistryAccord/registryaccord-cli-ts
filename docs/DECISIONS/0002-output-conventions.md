# 2. Output Conventions

## Status

Accepted

## Context

The RegistryAccord CLI needs consistent output conventions to provide a good user experience while supporting both human-readable and machine-readable use cases.

## Decision

We will use the following output conventions:

1. **Default output**: Human-readable tables with concise information
2. **JSON output**: Enabled with `--json` flag for machine-readable output
3. **Exit codes**: Deterministic exit codes as specified in CLI_REQUIREMENTS.md
4. **Error messages**: Include correlation IDs when available from services

### Exit Codes

- 0: Success
- 2: Validation/usage error
- 3: Authentication error
- 4: Network/transport error
- 5: Server error

### Output Examples

**Default (human-readable)**:
```
DID: did:plc:example
Public Key Fingerprint: abc123...
Key stored at: ~/.registryaccord/key.json
```

**JSON output**:
```json
{
  "did": "did:plc:example",
  "publicKeyFingerprint": "abc123...",
  "keyPath": "/home/user/.registryaccord/key.json"
}
```

## Consequences

- **Positive**: Consistent user experience across all commands
- **Positive**: Machine-readable output enables scripting and automation
- **Positive**: Deterministic exit codes enable reliable error handling in scripts
- **Positive**: Correlation IDs improve troubleshooting
- **Negative**: Maintaining both output formats requires additional code

## Alternatives Considered

1. **Only JSON output**: Less user-friendly for interactive use
2. **Custom formatting for each command**: Inconsistent user experience
3. **YAML output**: Additional dependency and complexity

## References

- CLI_REQUIREMENTS.md - Output and UX section
