import fs from 'node:fs/promises'
import path from 'node:path'
import { Plugin } from 'vite'
import chokidar from 'chokidar'
import prettier from 'prettier'
import glob from 'fast-glob'
import createDebugger from 'debug'

import { resolveOptions, type PluginOptions } from './options'

export default function shopifySchemaTemplates(config?: PluginOptions): Plugin {

    const options = resolveOptions(config)
    const schemaPattern = /{% schema %}(.*){% endschema %}/gms

    const debug = createDebugger('vite-plugin-shopify-schema-templates')

    let sectionWatcher: chokidar.FSWatcher
    let schemaWatcher: chokidar.FSWatcher

    function generateTemplateOutput(filename: string, content: string) {
        filename = filename.endsWith('.json') ? filename : `${filename}.json`
        return `/** TEMPLATE START: ${filename}
        * Last updated ${new Date().toString()}
        * The following settings were auto-imported from a schema template.
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
                tabWidth: options.jsonTabWidth
            })

            const formattedContent = content.replace(contentJson, `\n${formattedJson}`)
            return formattedContent

        }

    }

    function watchSectionFiles() {

        sectionWatcher = chokidar.watch(options.sectionsDir, {
            followSymlinks: true,
            ignored: '!*.liquid',
            ignoreInitial: false
        })

        sectionWatcher.on('all', async (event, file) => {

            if (['add', 'change'].includes(event)) {

                const filename = file.split('/').slice(-1)[0]
                const sectionContent = await fs.readFile(file, 'utf-8')
                if (sectionContent && sectionContent !== '') {

                    const templateMatches = Array.from(sectionContent.matchAll(options.regexPattern))

                    if (templateMatches && templateMatches[0]) {

                        const [templateString, templateName] = templateMatches[0]
                        const templatePath = path.join(options.schemaDir, `${templateName}.json`)

                        let templateContent = await fs.readFile(templatePath, 'utf-8')
                        if (templateContent && templateContent !== '') {

                            let jsonValue = Array.from(JSON.parse(templateContent))
                            if (jsonValue && jsonValue.length) {

                                templateContent = JSON.stringify(jsonValue).slice(1, -1)
                                templateContent = generateTemplateOutput(templateName, templateContent)

                                const updatedContent = sectionContent.replace(templateString, templateContent)
                                const formattedContent = await formatJson(updatedContent)

                                if (formattedContent && formattedContent !== "") {
                                    await fs.writeFile(file, formattedContent, 'utf-8')
                                    debug(`Schema from ${templateName}.json injected into ${filename}`)
                                }

                            }

                        }

                    }

                }

            }

        })

    }

    async function watchSchemaFiles() {

        sectionWatcher = chokidar.watch(options.schemaDir, {
            followSymlinks: true,
            ignored: '!*.json',
            ignoreInitial: false
        })

        sectionWatcher.on('all', async (event, file) => {

            if (['add', 'change'].includes(event)) {

                const filename = file.split('/').slice(-1)[0]
                debug(`Schema file ${event}: %s`, filename)

                let templateContent = await fs.readFile(file, 'utf-8')
                if (templateContent && templateContent !== '') {

                    let jsonValue = Array.from(JSON.parse(templateContent))
                    if (jsonValue && jsonValue.length) {

                        templateContent = JSON.stringify(jsonValue).slice(1, -1)

                        const commentPattern = new RegExp(`\\/\\*\\* TEMPLATE START: (${filename}).*\\/`, 'gms')
                        const sectionFiles = await glob(path.join(options.sectionsDir, '*.liquid'))

                        for (const sectionFile of sectionFiles) {

                            const sectionFilename = sectionFile.split('/').slice(-1)[0]
                            let sectionContent = await fs.readFile(sectionFile, 'utf-8')
                            if (sectionContent && sectionContent !== '') {

                                const sectionMatches = Array.from(sectionContent.matchAll(commentPattern))

                                if (sectionMatches && sectionMatches[0]) {

                                    const [templateString] = sectionMatches[0]
                                    let updatedTemplate = generateTemplateOutput(filename, `${templateContent.trim()},`)
                                    let updatedText = sectionContent.replace(templateString, updatedTemplate)

                                    const formattedContent = await formatJson(updatedText)

                                    if (formattedContent && formattedContent !== "") {
                                        await fs.writeFile(sectionFile, formattedContent, 'utf-8')
                                        debug(`Schema from ${filename} injected into ${sectionFilename}`)
                                    }

                                }

                            }

                        }

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
                        '@schema': options.schemaDir,
                        '@sections': options.sectionsDir
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
