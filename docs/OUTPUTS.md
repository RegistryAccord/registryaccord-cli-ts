# JSON Output Contracts

This document describes the stable JSON shapes returned by commands when `--json` is supplied.

All timestamps are ISO 8601 strings. All key material encodings are Base64 unless specified.

## identity:create

Command: `ra identity:create --json`

Shape:
```json
{
  "did": "string",
  "saved": true
}
```

Notes:
- `did` is of the form `did:ra:ed25519:<base58_public_key>`.

## post:create

Command: `ra post:create --json "<text>"`

Shape:
```json
{
  "id": "string",
  "created": true
}
```

Notes:
- `id` is a UUID v4.

## post:list

Command: `ra post:list --json`

Shape:
```json
{
  "count": 0,
  "posts": [
    {
      "id": "string",
      "createdAt": "ISO-8601",
      "text": "string",
      "signatureBase64": "base64",
      "publicKeyBase64": "base64",
      "did": "string",
      "valid": true
    }
  ]
}
```

Notes:
- `valid` indicates the result of verifying `text` against `signatureBase64` with `publicKeyBase64`.

## Stability policy

- Keys and shapes above are considered stable for 0.x releases of the PoC.
- Additive changes may introduce new fields but will not rename or remove existing fields without a documented breaking change.
