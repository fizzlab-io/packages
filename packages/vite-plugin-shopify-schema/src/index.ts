import VitePlugin, { fs, path, glob, prettier } from '@fizzlab.io/vite-plugin'

type PluginOptions = {
    schemaDir: string
    sectionsDir: string
    jsonTabWidth: number
}

export default new VitePlugin<PluginOptions>({
    name: 'vite-plugin-shopify-schema',
    enforce: 'post',
    options: {
        schemaDir: './schema',
        sectionsDir: './sections',
        jsonTabWidth: 4
    },
    register(plugin) {

        const schemaDir = path.resolve(plugin.rootDir, path.normalize(plugin.options.schemaDir))
        const sectionsDir = path.resolve(plugin.rootDir, path.normalize(plugin.options.sectionsDir))

        const declarationPattern = /\{\s?\"\@\":\s?\"(\S+)\"\s?\},?|\{\s+\"schema\":\s?\"(\S+)\"\s+\},?/gms
        const schemaBlockPattern = /{% schema %}(.*){% endschema %}/gms

        function commentPattern(filename?: string) {
            return filename
                ? new RegExp(`\/\*\*\s+\* TEMPLATE START: (${filename}).*?\/\*\*\s+\* TEMPLATE END\s+\*\/`, 'gms')
                : /\/\*\*\s+\* TEMPLATE START: (\S+).*?\/\*\*\s+\* TEMPLATE END\s+\*\//gms
        }

        function filenameWithExtension(filename: string, extension: string) {
            extension = extension.startsWith('.') ? extension : `.${extension}`
            return filename.endsWith(extension) ? filename : `${filename}${extension}`
        }

        async function formatJson(jsonContent: string, trailingComma: 'none' | 'es5' | 'all' | undefined = 'none') {

            try {

                const formattedJsonContent = await prettier.format(jsonContent, {
                    tabWidth: plugin.options.jsonTabWidth,
                    bracketSameLine: false,
                    trailingComma: trailingComma,
                    singleQuote: false,
                    parser: 'json'
                })

                return formattedJsonContent

            } catch(err) {

                plugin.log('warn', 'wnable to format output')
                return jsonContent

            }

        }

        async function formatSectionSchemaContent(sectionFileContents: string) {

            /** Search section file contents for the schema block. */
            const schemaBlockMatches = Array.from(sectionFileContents.matchAll(schemaBlockPattern))

            /** No schema block found, skip this step. */
            if (!schemaBlockMatches.length) return sectionFileContents

            /** Extract the schema block and block JSON content. */
            const [_, blockJson] = schemaBlockMatches[0]

            /** Format and prettify the block JSON content */
            const formattedBlockJson = await formatJson(blockJson)

            /** Replce the unformatted block content. */
            return sectionFileContents.replace(blockJson, formattedBlockJson)

        }

        async function writeFileContent(file: string, fileContent: string) {

            const filename = path.basename(file)

            try {

                await fs.writeFile(file, fileContent, { encoding: 'utf-8', flag: 'w' })

            } catch(err) {

                plugin.log('error', 'unable to write to file', filename)

            }

        }

        async function generateSectionSchemaContent(fileContents: string, matchResult: RegExpMatchArray) {

            /** Extract the declaration and schema filename. */
            let [fullMatch, schemaFilename] = matchResult

            /** Format the filename to include the extension. */
            schemaFilename = filenameWithExtension(schemaFilename, 'json')

            /** Get the full path to the schema file. */
            const schemaFilePath = path.join(schemaDir, schemaFilename)

            try {

                /** Check that the schema file exists. */
                await fs.access(schemaFilePath)

                /** Get the file contents of the schema template file. */
                const schemaFileContents = await fs.readFile(schemaFilePath, 'utf-8')

                /** The schema template file is empty or does not exist. */
                if (!schemaFileContents || schemaFileContents === '') {
                    plugin.log('error', 'schema template is empty', schemaFilename)
                    return fileContents
                }

                /** The schema template file is not wrapped in an array. */
                if (!schemaFileContents.startsWith('[') && !schemaFileContents.endsWith(']')) {
                    plugin.log('error', 'schema template is not an array', schemaFilename)
                    return fileContents
                }

                /** Extract and format the JSON from the schema file. */
                const schemaFileJson = schemaFileContents.trim().slice(1, -1).trim()

                /** Get the current date and time. */
                const timestamp = new Date().toLocaleString()

                const commentedJson = `\n/**
                    * TEMPLATE START: ${schemaFilename}
                    * Last imported ${timestamp}
                    * The following settings were auto-imported from a schema template.
                    * Please do not remove this comment or modify the following settings.
                    */
                ${schemaFileJson},
                /**
                 * TEMPLATE END
                 */\n`

                /** Replace the match with the schema file JSON contents. */
                return fileContents.replace(fullMatch, commentedJson)

            } catch(err) {
                plugin.log('error', 'schema template does not exist', schemaFilename)
                return fileContents
            }

        }

        async function injectSchemaTemplates(sectionFileContents: string) {

            /** Search file for instances of schema template declarations. */
            const declarationMatches = Array.from(sectionFileContents.matchAll(declarationPattern))

            /** Loop through each schema template declaration. */
            for (const declarationMatch of declarationMatches) {
                sectionFileContents = await generateSectionSchemaContent(sectionFileContents, declarationMatch)
            }

            return sectionFileContents

        }

        async function updateSchemaTemplates(sectionFileContents: string) {

            /** Search file for instances of schema comments. */
            const commentMatches = Array.from(sectionFileContents.matchAll(commentPattern()))

            /** Loop throw each schema comment. */
            for (const commentMatch of commentMatches) {
                sectionFileContents = await generateSectionSchemaContent(sectionFileContents, commentMatch)
            }

            return sectionFileContents

        }

        async function transformSectionFile(file: string) {

            /** Only transform ".liquid" files in the "sectionsDir" directory. */
            if (!file.includes(sectionsDir) || !file.endsWith('.liquid')) return

            /** The name of the section file with the extension. */
            const sectionFilename = path.basename(file)
            const sectionDirName = path.dirname(file).split(path.sep).pop()

            // /** Get file contents of the section file. */
            let sectionFileContents = await fs.readFile(file, 'utf-8')

            /** Inject schema template instances. */
            sectionFileContents = await injectSchemaTemplates(sectionFileContents)

            /** Update schema template instances. */
            sectionFileContents = await updateSchemaTemplates(sectionFileContents)

            const formattedFileContents = await formatSectionSchemaContent(sectionFileContents)
            await writeFileContent(file, formattedFileContents)

            plugin.log('success', 'schema injected', sectionFilename)

        }

        async function transformSchemaFile(file: string, sectionFiles: string[]) {

            /** Only transform ".json" files in the "schemaDir" directory. */
            if (!file.includes(schemaDir) || !file.endsWith('.json')) return

            for (const sectionFile of sectionFiles) {
                await transformSectionFile(sectionFile)
            }

        }

        async function execute(file?: string) {

            plugin.throttled = true

            const sectionFiles = await glob(path.join(sectionsDir, '*.liquid'))

            if (typeof file !== 'undefined') {

                await transformSectionFile(file)
                await transformSchemaFile(file, sectionFiles)

            } else {

                for (const sectionFile of sectionFiles) {
                    await transformSectionFile(sectionFile)
                }

            }

            await plugin.sleep(500)
            plugin.throttled = false

        }

        return {

            config() {
                return {
                    resolve: {
                        alias: {
                            '@schema': schemaDir,
                            '@sections': sectionsDir
                        }
                    }
                }
            },

            async buildStart() {
                execute()
            },

            async handleHotUpdate({ file }) {
                if (plugin.throttled) return
                execute(file)
            }

        }

    }
}).export
