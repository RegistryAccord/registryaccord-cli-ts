// src/lib/config.ts
// Centralized resolution of base URLs used by commands and services.
// Precedence: explicit inputs > environment variables > sane defaults.
//
// Environment variables:
// - RA_IDENTITY_BASE_URL: base URL for the identity service (default http://localhost:8081)
// - RA_CDV_BASE_URL: base URL for the CDV service (default http://localhost:8082)
// - RA_GATEWAY_BASE_URL: base URL for the Gateway service (default http://localhost:8083)
// - RA_ENV: environment (development|staging|production)
// - RA_OUTPUT: output format (table|json)
export type Bases = { 
  identityBase: string; 
  cdvBase: string; 
  gatewayBase: string;
  env: string;
  output: string;
}

export function resolveBases(input?: Partial<Bases>): Bases {
    const identityBase =
        input?.identityBase ||
        process.env.RA_IDENTITY_BASE_URL ||
        'http://localhost:8081'
    const cdvBase =
        input?.cdvBase ||
        process.env.RA_CDV_BASE_URL ||
        'http://localhost:8082'
    const gatewayBase =
        input?.gatewayBase ||
        process.env.RA_GATEWAY_BASE_URL ||
        'http://localhost:8083'
    const env =
        input?.env ||
        process.env.RA_ENV ||
        'development'
    const output =
        input?.output ||
        process.env.RA_OUTPUT ||
        'table'
    return { identityBase, cdvBase, gatewayBase, env, output }
}
