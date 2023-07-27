import type { AddressInfo } from 'node:net'
import type { ResolvedConfig, ResolvedServerUrls } from 'vite'
import VitePlugin from '@fizzlab.io/vite-plugin'
import prettier from 'prettier'
import prettierPluginLiquid from '@shopify/prettier-plugin-liquid'
import path from 'node:path'
import yaml from 'js-yaml'
import _ from 'lodash'

type PluginOptions = {

    /**
     * The path to the theme `schema` directory, relative to the theme root.
     */
    schemaDir?: string

    /**
     * The path to the theme `modules` directory, relative to the theme root.
     */
    modulesDir?: string

    /**
     * The path to the theme `assets` directory, relative to the theme root.
     */
    assetsDir?: string

    /**
     * The path to the theme `snippets` directory, relative to the theme root.
     */
    snippetsDir?: string

    /**
     * The path to the theme `sections` directory, relative to the theme root.
     */
    sectionsDir?: string

    /**
     * Whether or not to use prettier to format JSON files.
     */
    prettierJson?: boolean

    /**
     * Whether or not to use prettier to format liquid files.
     */
    prettierLiquid?: boolean

    /**
     * Shopify theme-check configuration.
     * @see https://github.com/Shopify/theme-check/tree/main
     */
    themecheck?: {

        /**
         * #### AssetPreload
         * Prevent manual preloading of assets.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/asset_preload.md
         */
        assetPreload?: boolean

        /**
         * #### AssetSizeCSS
         * Prevent large CSS bundles.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/asset_size_css.md
         */
        assetSizeCSS?: boolean

        /**
         * #### AssetSizeJavaScript
         * Prevent abuse on server rendered app blocks.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/asset_size_javascript.md
         */
        assetSizeJavaScript?: boolean

        /**
         * #### AssetUrlFilters
         * Ensure `asset_url` filters are used when serving assets.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/asset_url_filters.md
         */
        assetUrlFilters?: boolean

        /**
         * #### ContentForHeaderModification
         * Do not depend on the content of `content_for_header`.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/content_for_header_modification.md
         */
        contentForHeaderModification?: boolean

        /**
         * #### ConvertIncludeToRender
         * Discourage the use of `include` tags.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/convert_include_to_render.md
         */
        convertIncludeToRender?: boolean

        /**
         * #### DefaultLocale
         * Ensure theme has a default locale.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/default_locale.md
         */
        defaultLocale?: boolean

        /**
         * #### DeprecatedFilter
         * Discourage the use of deprecated filters.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/deprecated_filter.md
         */
        deprecatedFilter?: boolean

        /**
         * #### DeprecatedGlobalAppBlockType
         * Check for deprecated global app block type `@global`.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/deprecated_global_app_block_type.md
         */
        deprecatedGlobalAppBlockType?: boolean

        /**
         * #### HtmlParsingError
         * Report HTML parsing errors.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/html_parsing_error.md
         */
        htmlParsingError?: boolean

        /**
         * #### ImgLazyLoading
         * Encourage lazy loading image tags.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/img_lazy_loading.md
         */
        imgLazyLoading?: boolean

        /**
         * #### ImgWidthAndHeight
         * Ensure width and height attributes are included on image tags.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/img_width_and_height.md
         */
        imgWidthAndHeight?: boolean

        /**
         * #### LiquidTag
         * Encourage use of liquid tag for consecutive statements.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/liquid_tag.md
         */
        liquidTag?: boolean

        /**
         * #### MatchingSchemaTranslations
         * Spot errors in schema translations.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/matching_schema_translations.md
         */
        matchingSchemaTranslations?: boolean

        /**
         * #### MatchingTranslations
         * Prevent mismatching translations.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/matching_translations.md
         */
        matchingTranslations?: boolean

        /**
         * #### MissingRequiredTemplateFiles
         * Prevent missing required theme files.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/missing_required_template_files.md
         */
        missingRequiredTemplateFiles?: boolean

        /**
         * #### MissingTemplate
         * Prevent missing templates.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/missing_template.md
         */
        missingTemplate?: boolean

        /**
         * #### NestedSnippet
         * Prevent deeply nested snippets.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/nested_snippet.md
         */
        nestedSnippet?: boolean

        /**
         * #### PaginationSize
         * Ensure `paginate` tags are used with performant sizes.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/pagination_size.md
         */
        paginationSize?: boolean

        /**
         * #### ParserBlockingJavaScript
         * Discourage use of parser-blocking JavaScript.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/parser_blocking_javascript.md
         */
        parserBlockingJavaScript?: boolean

        /**
         * #### ParserBlockingScriptTag
         * Discourage use of parser-blocking `script_tag` filter.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/parser_blocking_script_tag.md
         */
        parserBlockingScriptTag?: boolean

        /**
         * #### RemoteAsset
         * Discourage use of third party domains for hosting assets.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/remote_asset.md
         */
        remoteAsset?: boolean

        /**
         * #### RequiredDirectories
         * Prevent missing directories.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/required_directories.md
         */
        requiredDirectories?: boolean

        /**
         * #### RequiredLayoutThemeObject
         * Prevent missing required objects in `theme.liquid`.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/required_layout_theme_object.md
         */
        requiredLayoutThemeObject?: boolean

        /**
         * #### SchemaJsonFormat
         * Prevent unformatted schema tags.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/schema_json_format.md
         */
        schemaJsonFormat?: boolean

        /**
         * #### SpaceInsideBraces
         * Ensure consistent spacing inside Liquid tags and variables.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/space_inside_braces.md
         */
        spaceInsideBraces?: boolean

        /**
         * #### SyntaxError
         * Prevent syntax errors.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/syntax_error.md
         */
        syntaxError?: boolean

        /**
         * #### TemplateLength
         * Discourage the use of large template files.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/template_length.md
         */
        templateLength?: boolean

        /**
         * #### TranslationKeyExists
         * Prevent use of undefined translations.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/translation_key_exists.md
         */
        translationKeyExists?: boolean

        /**
         * #### UndefinedObject
         * Prevent undefined object errors.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/undefined_object.md
         */
        undefinedObject?: boolean

        /**
         * #### UnknownFilter
         * Prevent use of unknown filters.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/unknown_filter.md
         */
        unknownFilter?: boolean

        /**
         * #### UnusedAssign
         * Prevent unused assigns.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/unused_assign.md
         */
        unusedAssign?: boolean

        /**
         * #### UnusedSnippet
         * Remove unused snippets in themes.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/unused_snippet.md
         */
        unusedSnippet?: boolean

        /**
         * #### ValidHTMLTranslation
         * Prevent invalid HTML inside translations.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/valid_html_translation.md
         */
        validHTMLTranslation?: boolean

        /**
         * #### ValidJson
         * Enforce valid JSON.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/valid_json.md
         */
        validJson?: boolean

        /**
         * #### ValidSchema
         * Enforce valid JSON in schema tags.
         * @see https://github.com/Shopify/theme-check/blob/main/docs/checks/valid_schema.md
         */
        validSchema?: boolean

    }

    /**
     * Prettier configuration for JSON and liquid files.
     * @see https://prettier.io/docs/en/options.html
     */
    prettier?: {

        /**
         * Prettier configuration for JSON files.
         */
        json?: {

            /**
             * Specify the number of spaces per indentation-level.
             */
            tabWidth?: number

            /**
             * Specify the line length that the printer will wrap on.
             */
            printWidth?: number

        }

        /**
         * Prettier configuration for liquid files.
         */
        liquid?: {

            /**
             * Specify the number of spaces per indentation-level.
             */
            tabWidth?: number

            /**
             * Specify the line length that the printer will wrap on.
             */
            printWidth?: number

            /**
             * If set to `true`, will indent the contents of the {% schema %} tag.
             */
            indentSchema?: boolean

            /**
             * Use single quotes instead of double quotes in Liquid tag and objects.
             */
            liquidSingleQuote?: boolean

            /**
             * Use single quotes instead of double quotes in embedded languages.
             */
            embeddedSingleQuote?: boolean
        }
    }
}

/**
 * ### vite-plugin-shopify
 */
export default new VitePlugin<PluginOptions>({

    name: 'vite-plugin-shopify',
    enforce: 'post',

    options: {
        schemaDir: './schema',
        modulesDir: './modules',
        assetsDir: './assets',
        snippetsDir: './snippets',
        sectionsDir: './sections',
        prettierJson: true,
        prettierLiquid: true,
        themecheck: {
            assetPreload: false,
            assetSizeCSS: false,
            assetSizeJavaScript: false,
            assetUrlFilters: false,
            contentForHeaderModification: false,
            convertIncludeToRender: false,
            defaultLocale: true,
            deprecatedFilter: true,
            deprecatedGlobalAppBlockType: true,
            htmlParsingError: true,
            imgLazyLoading: true,
            imgWidthAndHeight: true,
            liquidTag: true,
            matchingSchemaTranslations: true,
            matchingTranslations: true,
            missingRequiredTemplateFiles: true,
            missingTemplate: true,
            nestedSnippet: false,
            paginationSize: false,
            parserBlockingJavaScript: false,
            parserBlockingScriptTag: false,
            remoteAsset: false,
            requiredDirectories: true,
            requiredLayoutThemeObject: true,
            schemaJsonFormat: true,
            spaceInsideBraces: true,
            syntaxError: true,
            templateLength: false,
            translationKeyExists: true,
            undefinedObject: false,
            unknownFilter: true,
            unusedAssign: false,
            unusedSnippet: false,
            validHTMLTranslation: true,
            validJson: true,
            validSchema: false
        },
        prettier: {
            json: {
                tabWidth: 4,
                printWidth: 120
            },
            liquid: {
                tabWidth: 4,
                printWidth: 120,
                indentSchema: true,
                liquidSingleQuote: false,
                embeddedSingleQuote: true
            }
        }
    },

    register(plugin) {

        /**
         * The absolute path to the theme `schema` directory.
         */
        const schemaDir = path.resolve(plugin.rootDir, path.normalize(plugin.options.schemaDir))

        /**
         * The absolute path to the theme `modules` directory.
         */
        const modulesDir = path.resolve(plugin.rootDir, path.normalize(plugin.options.modulesDir))

        /**
         * The absolute path to the theme `assets` directory.
         */
        const assetsDir = path.resolve(plugin.rootDir, path.normalize(plugin.options.assetsDir))

        /**
         * The absolute path to the theme `sections` directory.
         */
        const sectionsDir = path.resolve(plugin.rootDir, path.normalize(plugin.options.sectionsDir))

        /**
         * The absolute path to the theme `snippets` directory.
         */
        const snippetsDir = path.resolve(plugin.rootDir, path.normalize(plugin.options.snippetsDir))

        /**
         * Regex pattern for detecting schema imports.
         * @example {"@": "my-schema-template"}
         */
        const regexSchemaImport = /\{\s?\"\@\":\s?\"(\S+)\"\s?\},?|\{\s+\"schema\":\s?\"(\S+)\"\s+\},?/gms

        /**
         * Regex pattern for detecting JSON schema blocks in liquid files.
         */
        const regexSchemaBlock = /{% schema %}(.*){% endschema %}/gms

        const styleExtensions = '*.{css,less,sass,scss,styl,stylus,pcss,postcss}'

        const scriptExtensions = '*.{js,jsx,ts,tsx}'

        const imageExtensions = '*.{jpg,jpeg,png,gif,webp}'

        const liquidExtensions = '*.liquid'

        const jsonExtensions = '*.json'

        /**
         * ### listAllModules
         * Returns an array of paths for all modules in the "modulesDir" directory.
         * @returns
         */
        async function listAllModules(): Promise<string[]> {

            return await plugin.getFiles(path.join(modulesDir, `**/${liquidExtensions}`))

        }

        /**
         * ### listAllSchemas
         * Returns an array of paths for all schemas in the "schemaDir" directory.
         * @returns
         */
        async function listAllSchemas(): Promise<string[]> {

            return await plugin.getFiles(path.join(schemaDir, jsonExtensions))

        }

        /**
         * ### listAllSections
         * Returns an array of paths for all schemas in the "sectionsDir" directory.
         * @returns
         */
        async function listAllSections(): Promise<string[]> {

            return await plugin.getFiles(path.join(sectionsDir, liquidExtensions))

        }

        /**
         * ### listAllSnippets
         * Returns an array of paths for all schemas in the "snippetsDir" directory.
         * @returns
         */
        async function listAllSnippets(): Promise<string[]> {

            return await plugin.getFiles(path.join(snippetsDir, liquidExtensions))

        }

        /**
         * ### shopifyignore
         * - Creates the .shopifyignore file at the root of the project if it doesn't exist.
         * - Appends the provided rules to the .shopifyignore file.
         * @param rules The rules to be applied to the .shopifyignore file.
         */
        async function shopifyignore(...rules: string[]): Promise<void> {

            /**
             * Get the full path to the .shopifyignore file.
             */
            const shopifyignore = plugin.filePath(plugin.rootDir, '.shopifyignore')

            /**
             * Determine if the .shopifyignore file exists.
             */
            const shopifyignoreExists = await plugin.fileExists(shopifyignore)

            /**
             * ### createShopifyignore
             * - Creates the .shopifyignore file at the project root.
             * - Adds any passed rules to the .shopifyignore file.
             */
            async function createShopifyignore(): Promise<void> {

                /**
                 * Create an empty .shopifyignore file.
                 */
                await plugin.writeFile(shopifyignore, '')
                plugin.log('success', 'project file created', '.shopifyignore')

                /**
                 * Append each rule to the .shopifyignore file.
                 */
                for (const rule of rules) {
                    await appendShopifyignoreRule(rule)
                }

            }

            /**
             * ### updateShopifyignore
             * Appends rules to the already existing .shopifyignore file.
             */
            async function updateShopifyignore(): Promise<void> {

                /**
                 * Get the contents of the .shopifyignore file.
                 */
                const shopifyignoreContent = await plugin.readFile(shopifyignore)

                /**
                 * Extract the existing rules in the .shopifyignore file.
                 */
                const shopifyignoreRules = shopifyignoreContent.split('\r\n')

                /**
                 * Append each rule to the .shopifyignore file,
                 * but only if the rule isn't already declared.
                 */
                for (const rule of rules) {
                    if (!shopifyignoreRules.includes(rule)) {
                        await appendShopifyignoreRule(rule)
                    }
                }

            }

            /**
             * ### appendShopifyignoreRule
             * Appends the provided rule to the end of the .shopifyignore file.
             * @param rule The rule being appended to the end of the .shopifyignore file
             */
            async function appendShopifyignoreRule(rule: string): Promise<void> {
                await plugin.appendFile(shopifyignore, rule + '\r\n')
            }

            shopifyignoreExists
                ? await updateShopifyignore()
                : await createShopifyignore()

        }

        /**
         * ### themecheck
         * Creates the .theme-check.yml file at the root of the project if it doesn't exist.
         */
        async function themecheck(): Promise<void> {

            const themecheckTemplate = yaml.load(`
            AssetPreload:
                enabled: ${plugin.options.themecheck.assetPreload}
                severity: suggestion
            AssetSizeCSS:
                enabled: ${plugin.options.themecheck.assetSizeCSS}
                threshold_in_bytes: 100_000
            AssetSizeJavaScript:
                enabled: ${plugin.options.themecheck.assetSizeJavaScript}
                threshold_in_bytes: 10000
            AssetUrlFilters:
                enabled: ${plugin.options.themecheck.assetUrlFilters}
            ContentForHeaderModification:
                enabled: ${plugin.options.themecheck.contentForHeaderModification}
            ConvertIncludeToRender:
                enabled: ${plugin.options.themecheck.convertIncludeToRender}
            DefaultLocale:
                enabled: ${plugin.options.themecheck.defaultLocale}
            DeprecatedFilter:
                enabled: ${plugin.options.themecheck.deprecatedFilter}
            DeprecatedGlobalAppBlockType:
                enabled: ${plugin.options.themecheck.deprecatedGlobalAppBlockType}
            HtmlParsingError:
                enabled: ${plugin.options.themecheck.htmlParsingError}
            ImgLazyLoading:
                enabled: ${plugin.options.themecheck.imgLazyLoading}
            ImgWidthAndHeight:
                enabled: ${plugin.options.themecheck.imgWidthAndHeight}
            LiquidTag:
                enabled: ${plugin.options.themecheck.liquidTag}
                min_consecutive_statements: 5
            MatchingSchemaTranslations:
                enabled: ${plugin.options.themecheck.matchingSchemaTranslations}
            MatchingTranslations:
                enabled: ${plugin.options.themecheck.matchingTranslations}
            MissingRequiredTemplateFiles:
                enabled: ${plugin.options.themecheck.missingRequiredTemplateFiles}
            MissingTemplate:
                enabled: ${plugin.options.themecheck.missingTemplate}
            NestedSnippet:
                enabled: ${plugin.options.themecheck.nestedSnippet}
                max_nesting_level: 3
            PaginationSize:
                enabled: ${plugin.options.themecheck.paginationSize}
                min_size: 1
                max_size: 50
            ParserBlockingJavaScript:
                enabled: ${plugin.options.themecheck.parserBlockingJavaScript}
            ParserBlockingScriptTag:
                enabled: ${plugin.options.themecheck.parserBlockingScriptTag}
            RemoteAsset:
                enabled: ${plugin.options.themecheck.remoteAsset}
            RequiredDirectories:
                enabled: ${plugin.options.themecheck.requiredDirectories}
            RequiredLayoutThemeObject:
                enabled: ${plugin.options.themecheck.requiredLayoutThemeObject}
            SchemaJsonFormat:
                enabled: ${plugin.options.themecheck.schemaJsonFormat}
                severity: style
                start_level: 0
                indent: '${Array.from({ length: plugin.options.prettier.liquid.tabWidth + 1 }).join(' ')}'
            SpaceInsideBraces:
                enabled: ${plugin.options.themecheck.spaceInsideBraces}
            SyntaxError:
                enabled: ${plugin.options.themecheck.syntaxError}
            TemplateLength:
                enabled: ${plugin.options.themecheck.templateLength}
                max_length: 600
                exclude_schema: true
                exclude_stylesheet: true
                exclude_javascript: true
            TranslationKeyExists:
                enabled: ${plugin.options.themecheck.translationKeyExists}
            UndefinedObject:
                enabled: ${plugin.options.themecheck.undefinedObject}
                exclude_snippets: true
            UnknownFilter:
                enabled: ${plugin.options.themecheck.unknownFilter}
            UnusedAssign:
                enabled: ${plugin.options.themecheck.unusedAssign}
            UnusedSnippet:
                enabled: ${plugin.options.themecheck.unusedSnippet}
            ValidHTMLTranslation:
                enabled: ${plugin.options.themecheck.validHTMLTranslation}
            ValidJson:
                enabled: ${plugin.options.themecheck.validJson}
            ValidSchema:
                enabled: ${plugin.options.themecheck.validSchema}`)

            /**
             * Get the full path to the .theme-check.yml file.
             */
            const themecheck = plugin.filePath(plugin.rootDir, '.theme-check.yml')

            /**
             * Determine if the .theme-check.yml file exists.
             */
            const themecheckExists = await plugin.fileExists(themecheck)

            /**
             * ### createThemecheck
             * Creates the .shopifyignore file at the project root.
             */
            async function createThemecheck(): Promise<void> {

                /**
                 * Create an empty .shopifyignore file.
                 */
                await plugin.writeFile(themecheck, yaml.dump(themecheckTemplate))
                plugin.log('success', 'project file created', '.theme-check.yml')
            }

            /**
             * ### updateThemecheck
             * Appends rules to the already existing .theme-check.yml file.
             */
            async function updateThemecheck(): Promise<void> {

                /**
                 * Get the contents of the .theme-check.yml file.
                 */
                const themecheckContent = await plugin.readFile(themecheck)
                const themecheckYaml = yaml.load(themecheckContent)

                if (themecheckContent === yaml.dump(themecheckTemplate)) return

                const updatedThemecheck = yaml.dump(_.merge(themecheckYaml, themecheckTemplate))
                await plugin.writeFile(themecheck, updatedThemecheck)
                plugin.log('success', '.theme-check.yml updated')

            }

            themecheckExists
                ? await updateThemecheck()
                : await createThemecheck()

        }

        /**
         * ### createProjectDirectories
         * Creates the relevant project directories if they don't exist.
         */
        async function createProjectDirectories(): Promise<void> {
            await plugin.createDirectory(schemaDir)
            await plugin.createDirectory(modulesDir)
            await plugin.createDirectory(snippetsDir)
            await plugin.createDirectory(sectionsDir)
        }

        /**
         * ### createProjectFiles
         * Creates the relevant project files if they don't exist.
         */
        async function createProjectFiles(): Promise<void> {

            await themecheck()

            await shopifyignore(
                plugin.basename(schemaDir, true),
                plugin.basename(modulesDir, true)
            )

        }

        /**
         * ### isValidJson
         * Checks whether or not JSON is valid.
         * @param json The JSON content being checked.
         * @returns
         */
        function isValidJson(json: string): boolean {
            try {
                JSON.parse(json)
                return true
            } catch {
                return false
            }
        }

        /**
         * ### prettierJson
         * Uses prettier under the hood to format and "prettify" JSON content.
         * @param json The JSON content being formatted.
         * @returns
         */
        async function prettierJson(json: string): Promise<string> {

            return await prettier.format(json, _.merge(plugin.options.prettier.json, {
                parser: 'json',
                singleQuote: false,
                quoteProps: 'preserve'
            }) as prettier.Options)

        }

        /**
         * ### prettierLiquid
         * Uses prettier under the hood to format and "prettify" liquid content.
         * @param liquid The liquid content being formatted.
         * @returns
         */
        async function prettierLiquid(liquid: string): Promise<string> {

            return await prettier.format(liquid, _.merge(plugin.options.prettier.liquid, {
                parser: 'liquid-html',
                plugins: [prettierPluginLiquid]
            }) as prettier.Options)

        }

        /**
         * ### handleModuleChanges
         * @param modulePath The path to the module file.
         */
        async function handleModuleChanges(modulePath: string): Promise<void> {

            /**
             * Not a module file, do nothing.
             */
            if (!modulePath.startsWith(modulesDir)) return

            /**
             * Get the filename of the module from the path.
             */
            const moduleFilename = plugin.basename(modulePath)

            if (plugin.options.prettierLiquid) {

                const moduleContent = await plugin.readFile(modulePath)
                const prettierModuleContent = await prettierLiquid(moduleContent)

                await plugin.writeFile(modulePath, prettierModuleContent)

            }

            /**
             *
             */
            if (moduleFilename.endsWith('.section.liquid')) {
                const sectionName = moduleFilename.replace('.section.liquid', '.liquid')
                await plugin.createSymlink(modulePath, path.join(sectionsDir, sectionName))
            }

            if (moduleFilename.endsWith('.snippet.liquid')) {
                const snippetName = moduleFilename.replace('.snippet.liquid', '.liquid')
                await plugin.createSymlink(modulePath, path.join(snippetsDir, snippetName))
            }

        }

        /**
         * ### handleSchemaChanges
         * @param schemaPath The path to the schema file.
         */
        async function handleSchemaChanges(schemaPath: string): Promise<void> {

            /**
             * Not a schema file, do nothing.
             */
            if (!schemaPath.startsWith(schemaDir)) return

            /**
             * Extract the raw content from the schema file.
             */
            const schemaFileContent = await plugin.readFile(schemaPath)

            /**
             * Check to make sure the schema JSON file is not empty.
             */
            if (!schemaFileContent || schemaFileContent === '') {
                plugin.log('warn', 'invalid schema', plugin.basenameWithDirectory(schemaPath))
                return
            }

            /**
             * Check to make sure the schema JSON is wrapped in an array.
             */
            if (!schemaFileContent.startsWith('[') && !schemaFileContent.endsWith(']')) {
                plugin.log('warn', 'invalid schema', plugin.basenameWithDirectory(schemaPath))
                return
            }

            /**
             * Check to make sure the schema JSON is valid.
             */
            if (!isValidJson(schemaFileContent)) {
                plugin.log('warn', 'invalid schema', plugin.basenameWithDirectory(schemaPath))
                return
            }

            /**
             * Extract the JSON content from the schema file.
             */
            const schemaFileJson = schemaFileContent.trim().slice(1, -1).trim()

            const formattedSchemaJson = await prettierJson(schemaFileContent)

        }

        async function handleProjectChanges(file?: string): Promise<void> {

            if (file) {

                plugin.throttled = true

                await handleModuleChanges(file)
                await handleSchemaChanges(file)

                await plugin.sleep(500)
                plugin.throttled = false

            } else {

                const modules = await listAllModules()
                const schemas = await listAllSchemas()

                for (const module of modules) {
                    await handleModuleChanges(module)
                }

                for (const schema of schemas) {
                    await handleSchemaChanges(schema)
                }

            }

        }

        return {

            transform(code) {

                if (plugin.config.command === 'serve') {
                    return code.replace(/VITE_SERVER_URL/g, plugin.viteServerUrl)
                }

            },

            async configureServer({ httpServer, middlewares }) {

                httpServer?.once('listening', async () => {

                    console.log(plugin.viteServerUrl)

                })

                return () => middlewares.use( async (req, res, next) => {

                    if (req.url === '/index.html') {
                        const html = await plugin.readFile(path.join(plugin.__dirname, 'plugin.html'))
                        res.statusCode = 404
                        res.end(html)
                    }

                    next()

                })

            },

            async buildStart() {

                await createProjectDirectories()
                await createProjectFiles()

                await handleProjectChanges()

            },

            async handleHotUpdate({ file }) {
                if (plugin.throttled) return
                await handleProjectChanges(file)
            },

            closeBundle() {

                if (plugin.config.command === 'serve') {
                    return
                }

            }

        }

    }

}).export
