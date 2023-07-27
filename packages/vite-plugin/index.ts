import type { DeepCompleteObject } from '@fizzlab.io/types'
import type { Plugin, ResolvedConfig, ServerOptions, ResolvedServerOptions } from 'vite'
import type { PathLike } from 'node:fs'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'os'
import { glob, type GlobOptionsWithFileTypesUnset } from 'glob'
import chalk from 'chalk'
import _ from 'lodash'

type LogLevel = 'info' | 'warn' | 'error' | 'success'

type PluginOptions = {
    logLevel?: Exclude<LogLevel, 'success'>
    rootDir?: string
}

type UserDefinedOptions<T> = T & PluginOptions

type ResolvedPluginOptions<T> = DeepCompleteObject<UserDefinedOptions<T>>

interface VitePluginConfig<T extends Record<string, any>> {
    name: string
    enforce?: Plugin['enforce']
    options?: UserDefinedOptions<T>
    register(plugin: InstanceType<typeof VitePlugin<T>>): VitePluginRegister
}

type VitePluginRegister = Omit<Plugin, 'name' | 'enforce'>

type ViteServerUrl = `${'http' | 'https'}://${string}:${number}`



/**
 * ## VitePlugin
 * Creates a new Vite plugin.
 */
export default class VitePlugin<T extends Record<string, any>> {

    public name: VitePluginConfig<T>['name']
    public enforce?: VitePluginConfig<T>['enforce']
    public options!: ResolvedPluginOptions<T>
    public config!: ResolvedConfig
    public throttled: boolean = false

    public export: (options?: UserDefinedOptions<T>) => Plugin

    private _defaultOptions: PluginOptions = {
        logLevel: 'info',
        rootDir: './'
    }

    public constructor(config: VitePluginConfig<T>) {

        this.name = config.name
        this.enforce = config.enforce
        this.options = this.resolveOptions(config.options)

        this.export = (options?: UserDefinedOptions<T>): Plugin => {
            this.options = this.resolveOptions(options, this.options)
            const plugin = this
            return _.merge(config.register(plugin), {
                name: this.name,
                enforce: this.enforce,
                configResolved(resolvedConfig) {
                    plugin.config = resolvedConfig
                },
            } satisfies Plugin) as Plugin
        }

    }

    private get timestamp() {
        return new Date().toLocaleTimeString()
    }

    public get __dirname() {
        return typeof __dirname !== 'undefined'
            ? __dirname
            : path.dirname(fileURLToPath(import.meta.url))
    }

    public get rootDir() {
        return path.resolve(path.join(process.cwd(), path.normalize(this.options.rootDir)))
    }

    public get viteServerUrl(): ViteServerUrl {

        const protocol = this.config.server.https ? 'https' : 'http'
        const host = resolveHost(this.config.server.host)
        const port = this.config.server.port || 5173

        function resolveHost(host?: string | boolean): string {

            if (!host) return 'localhost'

            if (host === true) {
                const nInterface = Object.values(os.networkInterfaces())
                    .flatMap(nInterface => nInterface ?? [])
                    .filter(detail => detail && detail.address &&
                        ((typeof detail.family === 'string' && detail.family === 'IPv4') ||
                        (typeof detail.family === 'number' && (detail as any).family === 4))
                    ).filter(detail => {
                        return detail.address !== '127.0.0.1'
                    })[0]

                if (!nInterface) return 'localhost'
                return nInterface.address
            }

            return host

        }

        return `${protocol}://${host}:${port}`


    }

    public basename(file: string, trailingSlash: boolean = false): string {
        return trailingSlash ? `${path.basename(file)}/` : path.basename(file)
    }

    public basenameWithDirectory(file: string): string {
        const filename = path.basename(file)
        const directory = path.dirname(file).split('/').pop()
        return `${directory}/${filename}`
    }

    public filePath(dir: string, file: string) {
        return path.resolve(dir, file)
    }

    /**
     * ### createFolder
     * Creates a new directory if it doesn't already exist
     * @param directory The path to the directory
     * @param recursive Whether or not to recursively create parent directories.
     */
    public async createDirectory(directory: string, recursive: boolean = true): Promise<void> {
        const directoryExists = await this.fileExists(directory)
        if (!directoryExists) await fs.mkdir(directory, { recursive })
    }

    /**
     * ### createSymlink
     * Creates a symbolic link.
     * @param source The path to the symlink.
     * @param target The path to where the symlink links to.
     */
    public async createSymlink(source: PathLike, target: PathLike) {
        const symlinkExists = await this.symlinkExists(target)
        if (!symlinkExists) await fs.symlink(source, target)
    }

    /**
     * ### readFile
     * Reads and returns the contents of a file
     * @param file The path to the file
     * @returns
     */
    public async readFile(file: PathLike): Promise<string> {
        return await fs.readFile(file, 'utf-8')
    }

    /**
     * ### writeFile
     * - Writes data to a file
     * - Creates the file if it doesn't already exist
     * @param file The path to the file
     * @param data The data being written to the file
     */
    public async writeFile(file: PathLike, data: string | Uint8Array): Promise<void> {
        await fs.writeFile(file, data, 'utf-8')
    }

    /**
     * ### appendFile
     * - Appends data to the end of a file
     * - Creates the file if it doesn't already exist
     * @param file The path to the file
     * @param data The data being appended to the file
     */
    public async appendFile(file: PathLike, data: string | Uint8Array): Promise<void> {
        await fs.appendFile(file, data, 'utf-8')
    }

    /**
     * ### getFiles
     * @param source
     * @param options
     * @returns
     */
    public async getFiles(source: string | string[], options?: GlobOptionsWithFileTypesUnset) {
        return await glob(source, options)
    }

    /**
     * ### getDirectories
     * Returns an array of all directories within the specified source directory
     * @param source The source directory
     * @returns
     */
    public async getDirectories(source: string) {
        const files = await fs.readdir(source, { withFileTypes: true })
        return files.filter(file => file.isDirectory()).map(file => path.join(source, file.name))
    }

    /**
     * ### fileExists
     * Checks whether or not a file exists
     * @param file The path to the file
     * @returns
     */
    public async fileExists(file: PathLike): Promise<boolean> {
        try {
            await fs.access(file)
            return true
        } catch {
            return false
        }
    }

    /**
     * ### smylinkExists
     * Checks whether or not a symlink exists
     * @param symlink The path to the symlink
     * @returns
     */

    public async symlinkExists(symlink: PathLike): Promise<boolean> {
        try {
            const stats = await fs.lstat(symlink)
            return stats.isSymbolicLink()
        } catch {
            return false
        }
    }

    private resolveOptions(options?: UserDefinedOptions<T>, defaults = this._defaultOptions): ResolvedPluginOptions<T> {
        return _.merge(defaults, options) as ResolvedPluginOptions<T>
    }

    public async sleep(delay: number) {
        await new Promise(resolve => setTimeout(resolve, delay))
    }

    public log(level: LogLevel, message: string, details?: string, ...args: any[]) {

        const timestamp = chalk.hex('#50565c')(this.timestamp)
        const plugin = chalk.hex('#56cdd6').bold(`[${this.name}]`)
        const output = `${timestamp} ${plugin} %MESSAGE% ${chalk.hex('#50565c')(details ?? '')}`

        const loggers: Record<LogLevel, string> = {
            info: output.replace('%MESSAGE%', chalk.blue(message)),
            success: output.replace('%MESSAGE%', chalk.green(message)),
            warn: output.replace('%MESSAGE%', chalk.yellow(message)),
            error: output.replace('%MESSAGE%', chalk.red(message)),
        }

        if (level === 'success') {
            console.log(loggers.success, ...args)
        }

        if (['info', 'warn', 'error'].includes(level) && level === 'info') {
            console.log(loggers.info, ...args)
        }

        if (['warn', 'error'].includes(level) && level === 'warn') {
            console.log(loggers.warn, ...args)
        }

        if (['error'].includes(level) && level === 'error') {
            console.log(loggers.error, ...args)
        }

    }

}
