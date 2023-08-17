import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    external: ['node:fs/promises', 'node:path', 'node:os'],
    clean: true,
    dts: true
})
