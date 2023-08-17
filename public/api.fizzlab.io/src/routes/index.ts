import Route from '../app/route'

export const index = new Route('/').get((req, res) => {
    res.status(200).json({
        status: 200,
        message: 'Success'
    })
})

export { crawl } from './crawl'
