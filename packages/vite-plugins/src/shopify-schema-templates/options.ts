import path from 'node:path'

export type PluginOptions = {
    schemaDir?: string
    sectionsDir?: string
    regexPattern?: RegExp
    jsonTabWidth?: number
}

export type ResolvedPluginOptions = Required<PluginOptions>

export const resolveOptions = (options?: PluginOptions): ResolvedPluginOptions => ({

    schemaDir:
        typeof options?.schemaDir !== 'undefined'
        ? path.normalize(options.schemaDir)
        : path.resolve(process.cwd(), './schema'),

    sectionsDir:
        typeof options?.sectionsDir !== 'undefined'
        ? path.normalize(options.sectionsDir)
        : path.resolve(process.cwd(), './sections'),

    regexPattern:
        typeof options?.regexPattern !== 'undefined'
        ? options.regexPattern
        : /{\"schema\": \"(\S+)\"}/g,

    jsonTabWidth:
        typeof options?.jsonTabWidth !== 'undefined'
        ? options.jsonTabWidth
        : 4

})
