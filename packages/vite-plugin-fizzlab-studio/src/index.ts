import type { Plugin } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

const CWD = process.cwd()

const DIRNAME = typeof __dirname === 'undefined'
    ? path.dirname(fileURLToPath(import.meta.url))
    : __dirname

type FizzLabStudioOptions = {
    adminPath: string
}

export default function FizzLabStudio(options?: FizzLabStudioOptions): Plugin {

    const pluginDir = path.join(DIRNAME, '../')

    async function createSymlinks() {

        const routes = await fs.readdir(path.join(pluginDir, './public/routes'))

        for (const route of routes) {

            const symlinkSource = path.join(pluginDir, './public/routes', route)
            const symlinkDestination = path.join(CWD, './src/routes', route)

            try {
                await fs.symlink(symlinkSource, symlinkDestination)
            } catch {}

        }

    }

    return {

        name: 'vite-plugin-fizzlab-studio',
        enforce: 'post',

        async buildStart() {

            console.log(process.cwd())

            await createSymlinks()

        }

    }

}
