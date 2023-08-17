import type { RequestHandler } from 'express'

export default class Middleware {

    public handler: RequestHandler

    public constructor(handler: RequestHandler) {
        this.handler = handler
    }

}
