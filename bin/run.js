#!/usr/bin/env node
// bin/run.js
// Production entrypoint for the CLI (ESM). Delegates to oclif's execute() with
// dir=import.meta.url so oclif can locate the manifest/commands.
import { execute } from '@oclif/core'

await execute({ dir: import.meta.url })
