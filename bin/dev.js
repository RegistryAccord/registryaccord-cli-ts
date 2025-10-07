#!/usr/bin/env -S node --loader ts-node/esm --no-warnings=ExperimentalWarning
// bin/dev.js
// Development entrypoint using ts-node ESM loader. This runs TypeScript directly
// without building, and sets oclif to development mode.
import { execute, settings } from '@oclif/core'

settings.performanceEnabled = false
await execute({ development: true, dir: import.meta.url })
