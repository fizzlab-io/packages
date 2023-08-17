import 'dotenv/config'

import express from 'express'
import * as routes from '../routes'
import { authguard } from '../middleware'

export default class Server {

    private static _app = express()
    private static _port: number = Number(process.env.PORT) || 3000

    public static listen(callback?: () => void) {

        this._app.use(authguard.handler)

        Object.values(routes).map(route => {
            this._app.use(route.path, route.handler)
        })

        this._app.listen(this._port, callback ? callback : () => {
            console.log(`API listening on port ${this._port}`)
        })

    }

}
