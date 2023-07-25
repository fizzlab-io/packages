import { defineConfig } from 'vite'
import { shopifySchema } from '@fizzlab.io/vite-plugins'

export default defineConfig({
    plugins: [
        shopifySchema()
    ]
})
