# 4. Retry Strategy

## Status

Accepted

## Context

The RegistryAccord CLI needs to handle transient network errors and service unavailability gracefully to provide a robust user experience.

## Decision

We will implement automatic retries with exponential backoff for specific error conditions:

### Retry Conditions

1. **HTTP 429** (Rate Limited)
2. **HTTP 503** (Service Unavailable)
3. **Network timeouts**
4. **Connection errors**

### Retry Policy

- **Maximum attempts**: 3 (including the initial attempt)
- **Backoff strategy**: Exponential backoff starting at 1000ms
- **Backoff formula**: `delay = baseDelay * 2^attempt`
- **Maximum delay**: No explicit maximum (capped by timeout)
- **Configurable**: Retries can be disabled with a `--no-retry` flag

### Implementation

```javascript
const retries = opts.retries ?? 3
const backoffMs = opts.backoffMs ?? 1000

for (let attempt = 0; attempt <= retries; attempt++) {
  try {
    // Make request
    const response = await fetch(url, opts)
    
    // Handle response
    if (response.ok) {
      return response
    }
    
    // Check if we should retry based on status code
    if (shouldRetry(response.status) && attempt < retries) {
      const delay = backoffMs * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
      continue
    }
    
    // Throw error for non-retryable or final attempt
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  } catch (error) {
    // Check if we should retry based on error type
    if (shouldRetryError(error) && attempt < retries) {
      const delay = backoffMs * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
      continue
    }
    
    // Re-throw error for non-retryable or final attempt
    throw error
  }
}
```

## Consequences

- **Positive**: Improved resilience to transient errors
- **Positive**: Better user experience with automatic recovery
- **Positive**: Configurable retry behavior for different use cases
- **Negative**: Increased latency for failed requests
- **Negative**: Additional complexity in error handling

## Alternatives Considered

1. **No retries**: Poor user experience for transient errors
2. **Fixed delay**: Less efficient than exponential backoff
3. **Infinite retries**: Risk of hanging indefinitely
4. **User-prompted retries**: Poor experience for automated use cases

## References

- CLI_REQUIREMENTS.md - Error Handling and Retries section
