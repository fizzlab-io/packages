import shopify from '@fizzlab.io/vite-plugin-shopify'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [
        shopify()
    ]
})
