import fs from 'node:fs/promises'
import path from 'node:path'
import { Plugin, ResolvedConfig } from 'vite'
import chokidar from 'chokidar'
import prettier from 'prettier'

import { resolveOptions, type PluginOptions } from './options'

export default function shopifySchemaTemplates(options?: PluginOptions): Plugin {

    /**
     * RexExp pattern used to extract template placeholders.
     * @example {"%schema%": "__TEMPLATE__"}
     */
    const templatePattern = /{\"%schema%\": \"(\S+)\"}/g
    const schemaPattern = /{% schema %}(.*){% endschema %}/gms

    const resolvedOptions = resolveOptions(options)
    let resolvedConfig: ResolvedConfig

    let watcher: chokidar.FSWatcher

    return {

        name: 'vite-plugin-shopify-schema-templates',
        enforce: 'post',

        config() {
            return {
                resolve: {
                    alias: {
                        '@schema': path.resolve()
                    }
                }
            }
        },

        configResolved(config) {
            resolvedConfig = config
        },

        async buildStart() {

            try {

                watcher = chokidar.watch(resolvedOptions.sectionsDir, {
                    followSymlinks: true,
                    ignored: '!*.liquid',
                    ignoreInitial: false
                })

                watcher.on('all', async (event, file) => {

                    if (['add', 'change'].includes(event)) {

                        const sectionContent = await fs.readFile(file, 'utf-8')
                        const templateMatches = sectionContent.matchAll(templatePattern)

                        for (const match of templateMatches) {

                            const [templateString, templateName] = match
                            const templatePath = path.join(resolvedOptions.schemaDir, `${templateName}.json`)
                            const templateContent = await fs.readFile(templatePath, 'utf-8')

                            const updatedContent = sectionContent.replace(templateString, templateContent)
                            const contentMatches = updatedContent.matchAll(schemaPattern)

                            for (const match of contentMatches) {

                                const [_, contentJson] = match
                                const formattedJson = await prettier.format(contentJson, { parser: 'json', tabWidth: resolvedOptions.jsonTabWidth })
                                const formattedContent = updatedContent.replace(contentJson, `\n${formattedJson}`)

                                await fs.writeFile(file, formattedContent, 'utf-8')

                            }

                        }

                    }

                })

            } catch(err) {

                console.error(err)

            }

        },

        buildEnd() {
            watcher?.close()
        }

    }

}
