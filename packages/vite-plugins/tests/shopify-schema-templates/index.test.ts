import { describe, afterEach, vi, it } from 'vitest'
import { build } from 'vite'
import path from 'node:path'

import plugin from '../../src/shopify-schema-templates'

describe('vite-plugin-shopify-schema-templates', () => {

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('reads the files', async () => {
        await build({
            logLevel: 'silent',
            plugins: [plugin({
                schemaDir: path.join(__dirname, '__fixtures__', 'schema'),
                sectionsDir: path.join(__dirname, '__fixtures__', 'sections'),
            })]
        })
    })

})
