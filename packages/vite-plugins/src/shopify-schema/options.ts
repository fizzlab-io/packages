import path from 'node:path'

export type PluginOptions = {
    schemaDir?: string
    sectionsDir?: string
    jsonTabWidth?: number,
    autoFormatJSON?: boolean,
    logLevels?: ('info' | 'warn' | 'error')[]
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

    jsonTabWidth:
        typeof options?.jsonTabWidth !== 'undefined'
        ? options.jsonTabWidth
        : 4,

    autoFormatJSON:
        typeof options?.autoFormatJSON !== 'undefined'
        ? options.autoFormatJSON
        : true,

    logLevels:
        typeof options?.logLevels !== 'undefined'
        ? options.logLevels
        : ['info', 'warn', 'error']

})
