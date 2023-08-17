import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

import fizzlab from '@fizzlab.io/vite-plugin-fizzlab-studio'

export default defineConfig({
	plugins: [fizzlab(), sveltekit()]
})
