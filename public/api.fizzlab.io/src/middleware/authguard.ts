import Middleware from '../app/middleware'

export default new Middleware((req, res, next) => {
    const auth = req.headers.authorization
    if (auth === 'password') {
        next()
    } else {
        res.status(401).json({
            status: 401,
            error: 'Unauthorized'
        })
    }
})
