import { type RequestHandler, type Router } from 'express'
import AppRouter from './router'

export default class Route {

    public path: string
    public handler!: Router

    public constructor(path: string) {
        this.path = path
    }

    public get(handler: RequestHandler) {
        this.handler = AppRouter.get(this.path, handler)
        return this
    }

}
