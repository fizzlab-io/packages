declare interface Shopify {
    PaymentButton: {
        init(): void
    }
    cdnHost: string
    country: string
    currency: {
        active: string
        rate: string
    }
    locale: string
    modules: boolean
    recaptchaV3?: {
        siteKey: string
    }
    routes: {
        root: string
    }
    shop: string
    theme: {
        handle: string
        id: number
        name: string
        role: string
        style: {
            id: number | null
            handle: string | null
        }
        theme_store_id: number | null
    }
}
