import Route from '../../app/route'
import puppeteer from 'puppeteer'

export const crawl = new Route('/crawl').get( async (req, res) => {

    try {

        const browser = await puppeteer.launch({ headless: 'new' })
        const page = await browser.newPage()

        await page.setViewport({ width: 1920, height: 1080 })
        await page.goto('https://places.singleplatform.com/rivers-edge-restaurant-9/menu', { waitUntil: 'networkidle0' })

        const data = await page.evaluate(() => {

            const menus = Array.from(document.querySelectorAll('.menu')) || []

            return {

                menus: menus.map(menu => {

                    const id = menu.getAttribute('id')
                    const title = document.querySelector(`.menu-name[toggle="#${id}"]`)?.textContent?.trim() as string

                    const sections = Array.from(menu.querySelectorAll('.section')) || []
                    const footnote = menu.querySelector('.footnote')?.textContent?.trim() || null

                    return {
                        id,
                        title,
                        sections: sections.map(section => {

                            const title = section.querySelector('.title > h3')?.textContent?.trim()
                            const description = section.querySelector('.items > .description')?.textContent?.trim() || null
                            const items = Array.from(section.querySelectorAll('.items .item')) || []

                            return {
                                title,
                                description,
                                items: items.map(item => {

                                    const id = item.getAttribute('id')
                                    const title = item.querySelector('h4.item-title')?.textContent?.trim()
                                    const price = item.querySelector('.price')?.textContent?.trim()
                                    const description = item.querySelector('.description')?.textContent?.trim() || null

                                    const allergens = item.querySelector('.allergens')?.textContent?.replace('Allergens', '').trim().split(', ') || []
                                    const diet = item.querySelector('.no-allergens')?.textContent?.trim().split(', ') || []

                                    const addons = Array.from(item.querySelectorAll('.addon')) || []

                                    return {
                                        id,
                                        title,
                                        price,
                                        description,
                                        allergens,
                                        diet,
                                        addons: addons.map(addon => {

                                            const title = addon.querySelector('.title')?.textContent?.trim()
                                            const price = addon.querySelector('.price')?.textContent?.trim()

                                            return {
                                                title,
                                                price
                                            }

                                        })
                                    }

                                })
                            }

                        }),
                        footnote
                    }

                })

            }

        })

        await browser.close()

        res.status(200).json({
            status: 200,
            message: 'Hello from crawl',
            data
        })

    } catch(error) {

        console.error(error)

        res.status(500).json({
            status: 500,
            message: 'Unable to crawl page',
            error
        })

    }

})
