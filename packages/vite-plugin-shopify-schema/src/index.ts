import fs from 'node:fs/promises'
import path from 'node:path'
import prettier from 'prettier'
import glob from 'fast-glob'
import chalk from 'chalk'

import { Plugin } from 'vite'
import { resolveOptions, type PluginOptions } from './options'

export default function shopifySchema(config?: PluginOptions): Plugin {

    let throttled = false

    const options = resolveOptions(config)

    const declarationPattern = /\{\s?\"schema\":\s?\"(\S+)\"\s?\}|\{\s+\"schema\":\s?\"(\S+)\"\s+\}/gms
    const schemaBlockPattern = /{% schema %}(.*){% endschema %}/gms

    function info(message: string, ...args: any[]) {
        if (['info', 'warn', 'error'].includes(options.logLevel)) {
            console.log('\n', chalk.bgBlue.black.bold(' INFO '), chalk.blue(message), ...args)
        }
    }

    function pass(message: string, ...args: any[]) {
        console.log('\n', chalk.bgGreen.black.bold(' PASS '), chalk.green(message), ...args)
    }

    function warn(message: string, ...args: any[]) {
        if (['warn', 'error'].includes(options.logLevel)) {
            console.log('\n', chalk.bgYellow.black.bold(' WARN '), chalk.yellow(message), ...args)
        }
    }

    function fail(message: string, ...args: any[]) {
        if (['error'].includes(options.logLevel)) {
            console.log('\n', chalk.bgRed.black.bold(' FAIL '), chalk.red(message), ...args)
        }
    }

    async function sleep(delay: number) {
        await new Promise(resolve => setTimeout(resolve, delay))
    }

    function commentPattern(filename?: string) {
        return filename
            ? new RegExp(`\/\*\*\s+\* TEMPLATE START: (${filename}).*\/\*\*\s+\* TEMPLATE END\s+\*\/`, 'gms')
            : /\/\*\*\s+\* TEMPLATE START: (\S+).*\/\*\*\s+\* TEMPLATE END\s+\*\//gms
    }

    function filenameWithExtension(filename: string, extension: string) {
        extension = extension.startsWith('.') ? extension : `.${extension}`
        return filename.endsWith(extension) ? filename : `${filename}${extension}`
    }

    async function formatJson(jsonContent: string) {

        try {

            const formattedJsonContent = await prettier.format(jsonContent, {
                tabWidth: options.jsonTabWidth,
                bracketSameLine: false,
                trailingComma: 'none',
                singleQuote: false,
                parser: 'json'
            })

            return formattedJsonContent

        } catch(err) {

            warn('Unable to format JSON', err)
            return jsonContent

        }

    }

    async function formatSectionSchemaContent(sectionFileContents: string) {

        /** Search section file contents for the schema block. */
        const schemaBlockMatches = Array.from(sectionFileContents.matchAll(schemaBlockPattern))

        /** No schema block found, skip this step. */
        if (!schemaBlockMatches.length) return sectionFileContents

        /** Extract the schema block and block JSON content. */
        const [blockMatch, blockJson] = schemaBlockMatches[0]

        /** Format and prettify the block JSON content */
        const formattedBlockJson = await formatJson(blockJson)

        /** Replce the unformatted block content. */
        return sectionFileContents.replace(blockJson, formattedBlockJson)

    }

    async function writeFileContent(file: string, fileContent: string): Promise<void> {
        return new Promise( async (resolve, reject) => {
            const filename = path.basename(file)
            try {
                await fs.writeFile(file, fileContent, { encoding: 'utf-8', flag: 'w' })
                resolve()
            } catch(err) {
                reject(fail(
                    'Unable to write to file',
                    `\n        ${chalk.gray('Reason:')} ${err}`,
                    `\n        ${chalk.gray('Schema:')} ${filename}`
                ))
            }
        })
    }

    async function writeSectionFile(sectionFile: string, sectionFilename: string, sectionFileContents: string, matchResult: RegExpMatchArray) {

        try {

            /** Inject the template schema into the file contents. */
            const [schemaFilename, updatedFileContents] = await generateSectionSchemaContent(sectionFileContents, matchResult)

            /** Format and prettify the JSON content of the file. */
            const formattedFileContents = await formatSectionSchemaContent(updatedFileContents) ?? undefined

            /** Write the new content to the section file. */
            await writeFileContent(sectionFile, formattedFileContents)

            pass(
                `Schema template imported`,
                `\n        ${chalk.gray('Source File: ...........')} ${chalk.white(schemaFilename)}`,
                `\n        ${chalk.gray('Target File: ...........')} ${chalk.white(sectionFilename)}`
            )

        } catch(err) {

            err

        }

    }

    async function generateSectionSchemaContent(fileContents: string, matchResult: RegExpMatchArray): Promise<[string, string]> {

        return new Promise( async (resolve, reject) => {

            /** Extract the declaration and schema filename. */
            let [fullMatch, schemaFilename] = matchResult

            /** Format the filename to include the extension. */
            schemaFilename = filenameWithExtension(schemaFilename, 'json')

            /** Get the full path to the schema file. */
            const schemaFilePath = path.join(options.schemaDir, schemaFilename)

            try {

                /** Check that the schema file exists. */
                await fs.access(schemaFilePath)

                /** Get the file contents of the schema template file. */
                const schemaFileContents = await fs.readFile(schemaFilePath, 'utf-8')

                /** The schema template file is empty or does not exist. */
                if (!schemaFileContents || schemaFileContents === '') {

                    warn(
                        `Unable to parse schema template`,
                        `\n       ${chalk.gray('Reason:')} Schema template file is empty or does not exist`,
                        `\n       ${chalk.gray('Schema:')} ${schemaFilename}`
                    )

                    return [schemaFilename, fileContents]

                }

                /** The schema template file is not wrapped in an array. */
                if (!schemaFileContents.startsWith('[') && !schemaFileContents.endsWith(']')) {

                    warn(
                        `Unable to parse schema template`,
                        `\n       ${chalk.gray('Reason:')} Schema template file must be an array`,
                        `\n       ${chalk.gray('Schema:')} ${schemaFilename}`
                    )

                    return [schemaFilename, fileContents]

                }

                /** Extract and format the JSON from the schema file. */
                const schemaFileJson = schemaFileContents.trim().slice(1, -1).trim()

                /** Get the current date and time. */
                const timestamp = new Date().toLocaleString()

                const commentedJson = `/**
                * TEMPLATE START: ${schemaFilename}
                * Last imported ${timestamp}
                * The following settings were auto-imported from a schema template.
                * Please do not remove this comment or modify the following settings.
                */
                ${schemaFileJson},
                /**
                 * TEMPLATE END
                 */`

                /** Replace the match with the schema file JSON contents. */
                let updatedFileContents = fileContents.replace(fullMatch, commentedJson)
                resolve([schemaFilename, updatedFileContents])

            } catch(err) {

                reject(fail(
                    'Unable to access schema template',
                    `\n        ${chalk.gray('Reason:')} Schema template file does not exist`,
                    `\n        ${chalk.gray('Schema:')} ${schemaFilename}`
                ))

            }

        })

    }

    async function injectSchemaTemplates(sectionFile: string, sectionFileContents: string) {

        /** The name of the section file with the extension. */
        const sectionFilename = path.basename(sectionFile)

        /** Search file for instances of schema template declarations. */
        const declarationMatches = Array.from(sectionFileContents.matchAll(declarationPattern))

        /** No declarations were found, skip this step. */
        if (!declarationMatches.length) return

        /** Loop through each schema template declaration. */
        for (const declarationMatch of declarationMatches) {

            await writeSectionFile(sectionFile, sectionFilename, sectionFileContents, declarationMatch)

        }

    }

    async function updateSchemaTemplates(sectionFile: string, sectionFileContents: string) {

        /** The name of the section file with the extension. */
        const sectionFilename = path.basename(sectionFile)

        /** Search file for instances of schema comments. */
        const commentMatches = Array.from(sectionFileContents.matchAll(commentPattern()))

        /** No schema comments were found, skip this step. */
        if (!commentMatches.length) return

        /** Loop throw each schema comment. */
        for (const commentMatch of commentMatches) {

            await writeSectionFile(sectionFile, sectionFilename, sectionFileContents, commentMatch)

        }

    }

    async function transformSectionFile(file: string) {

        /** Only transform ".liquid" files in the "sectionsDir" directory. */
        if (!file.includes(options.sectionsDir) || !file.endsWith('.liquid')) return

        // /** Get file contents of the section file. */
        const sectionFileContents = await fs.readFile(file, 'utf-8')

        await Promise.all([
            /** Inject schema template instances. */
            injectSchemaTemplates(file, sectionFileContents),
            /** Update schema template instances. */
            updateSchemaTemplates(file, sectionFileContents)
        ])

    }

    async function transformSchemaFile(file: string, sectionFiles: string[]) {

        /** Only transform ".json" files in the "schemaDir" directory. */
        if (!file.includes(options.schemaDir) || !file.endsWith('.json')) return

        for (const sectionFile of sectionFiles) {
            await transformSectionFile(sectionFile)
        }

    }

    async function execute(file?: string) {

        throttled = true

        const sectionFiles = await glob(path.join(options.sectionsDir, '*.liquid'))
        const schemaFiles = await glob(path.join(options.schemaDir, '*.json'))

        if (file) {

            await transformSchemaFile(file, sectionFiles)
            await transformSectionFile(file)

        } else {

            for (const schemaFile of schemaFiles) await transformSchemaFile(schemaFile, sectionFiles)

        }

        await sleep(500)
        throttled = false

    }

    return {

        name: 'vite-plugin-shopify-schema',
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
            execute()
        },

        async handleHotUpdate({ file }) {
            if (throttled) return
            execute(file)
        }

    }

}
