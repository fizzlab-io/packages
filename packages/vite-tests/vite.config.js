import shopify from '@fizzlab.io/vite-plugin-shopify'
import shopifySchema from '@fizzlab.io/vite-plugin-shopify-schema'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [
        shopify()
    ]
})
