import fs from 'node:fs/promises'
import path from 'node:path'
import { Plugin } from 'vite'
import chokidar from 'chokidar'
import prettier from 'prettier'
import glob from 'fast-glob'

import { resolveOptions, type PluginOptions } from './options'

export default function shopifySchemaTemplates(options?: PluginOptions): Plugin {

    const templatePattern = /{\"%schema%\": \"(\S+)\"}/g
    const schemaPattern = /{% schema %}(.*){% endschema %}/gms

    const resolvedOptions = resolveOptions(options)

    let sectionWatcher: chokidar.FSWatcher
    let schemaWatcher: chokidar.FSWatcher

    function generateTemplateOutput(filename: string, content: string) {
        filename = filename.endsWith('.json') ? filename : `${filename}.json`
        return `/** TEMPLATE START: ${filename}
        * Last updated ${new Date().toString()}
        * The following settings were auto-imported from a template.
        * Please do not modify the following settings directly.
        */
        ${content}
        /** TEMPLATE END */\n`
    }

    async function formatJson(content: string) {

        const contentMatches = Array.from(content.matchAll(schemaPattern))

        if (contentMatches && contentMatches[0]) {

            const [_, contentJson] = contentMatches[0]
            const formattedJson = await prettier.format(contentJson, {
                parser: 'json',
                trailingComma: 'none',
                tabWidth: resolvedOptions.jsonTabWidth
            })

            console.log('formattedJson:\n', formattedJson)

            const formattedContent = content.replace(contentJson, `\n${formattedJson}`)
            return formattedContent

        } else {

            console.log('content:\n', content)
            throw new Error('Unable to match schema pattern')

        }

    }

    function watchSectionFiles() {

        sectionWatcher = chokidar.watch(resolvedOptions.sectionsDir, {
            followSymlinks: true,
            ignored: '!*.liquid',
            ignoreInitial: false
        })

        sectionWatcher.on('all', async (event, file) => {

            if (['add', 'change'].includes(event)) {

                console.log(`Section file changed:`, file)

                const sectionContent = await fs.readFile(file, 'utf-8')
                const templateMatches = Array.from(sectionContent.matchAll(templatePattern))

                if (templateMatches && templateMatches[0]) {

                    const [templateString, templateName] = templateMatches[0]
                    const templatePath = path.join(resolvedOptions.schemaDir, `${templateName}.json`)

                    let templateContent = await fs.readFile(templatePath, 'utf-8')
                    templateContent = generateTemplateOutput(templateName, templateContent)

                    const updatedContent = sectionContent.replace(templateString, templateContent)
                    const formattedContent = await formatJson(updatedContent)

                    if (formattedContent && formattedContent !== "") {
                        await fs.writeFile(file, formattedContent, 'utf-8')
                    }

                }

            }

        })

    }

    async function watchSchemaFiles() {

        sectionWatcher = chokidar.watch(resolvedOptions.schemaDir, {
            followSymlinks: true,
            ignored: '!*.json',
            ignoreInitial: false
        })

        sectionWatcher.on('all', async (event, file) => {

            if (['add', 'change'].includes(event)) {

                console.log(`Schema file changed:`, file)

                const templateContent = await fs.readFile(file, 'utf-8')

                const filename = file.split('/').slice(-1)[0]
                const commentPattern = new RegExp(`\\/\\*\\* TEMPLATE START: (${filename}).*\\/`, 'gms')
                const sectionFiles = await glob(path.join(resolvedOptions.sectionsDir, '*.liquid'))

                for (const sectionFile of sectionFiles) {

                    let sectionContent = await fs.readFile(sectionFile, 'utf-8')
                    const sectionMatches = Array.from(sectionContent.matchAll(commentPattern))

                    if (sectionMatches && sectionMatches[0]) {

                        const [templateString] = sectionMatches[0]
                        let updatedTemplate = generateTemplateOutput(filename, `${templateContent.trim()},`)
                        let updatedText = sectionContent.replace(templateString, updatedTemplate)

                        const formattedContent = await formatJson(updatedText)

                        if (formattedContent && formattedContent !== "") {
                            await fs.writeFile(sectionFile, formattedContent, 'utf-8')
                        }

                    } else {

                        console.log('sectionContent:\n', sectionContent)
                        throw new Error('Unable to match comment pattern')

                    }

                }

            }

        })

    }

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

        async buildStart() {

            try {

                watchSectionFiles()
                watchSchemaFiles()

            } catch(err) {

                console.error(err)

            }

        },

        buildEnd() {
            sectionWatcher?.close()
            schemaWatcher?.close()
        }

    }

}
