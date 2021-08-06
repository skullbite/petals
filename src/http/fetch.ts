import fetch, { BodyInit, Response } from "node-fetch"
import type RawClient from "../client"
type BasicJSON = { [x: string]: string }
type HTTPMethods = "GET"     |
                   "HEAD"    |
                   "POST"    |
                   "PUT"     |
                   "DELETE"  |
                   "CONNECT" |
                   "OPTIONS" |
                   "TRACE"   |
                   "PATCH"

export class HTTPError extends Error {
    endpoint: string
    status: number
    constructor(message: string, endpoint: string, status: number) {
        super(message)
        this.endpoint = endpoint
        this.status = status
    }
}
export default class PetalsFetch {
    baseURL: string
    headers: BasicJSON
    private bot: RawClient
    private lastRes: Response
    constructor(baseURL: string, headers: BasicJSON, bot: RawClient) {
        this.baseURL = baseURL
        this.headers = headers
        this.bot = bot
    }
    private async request(endpoint: string, reqData?: { method?: HTTPMethods, body?: BodyInit, headers?: BasicJSON }): Promise<Response> {
        if (!reqData.headers) reqData.headers = {}
        if (!reqData.headers["Content-Type"]) reqData.headers["Content-Type"] = "application/json"
        const data = {
            method: reqData.method ?? "GET",
            headers: { 
                ...reqData.headers,
                ...this.headers
            },
            body: reqData.body
        }
        if (!reqData.body) delete data.body
        // TODO: Bucket Requests
        /* if (this.lastRes) {
            if (this.lastRes.headers["X-RateLimit-Remaining"] === 0) await new Promise(resolve => setTimeout(resolve, this.lastRes.headers["X-RateLimit-Reset"] - Date.now() ))
        } */
        const req = fetch(this.baseURL+endpoint, data), res = await req
        if (res.ok) {
            this.lastRes = res
            return res 
        }
        const content = await res.json()
        if (!content) { 
            this.lastRes = res
            return res 
        }
        process.once("unhandledRejection", e => this.bot.emit("error.rest", e))
        switch (res.status) {
        case 400:
        case 401:
        case 403:
        case 405:
            throw new HTTPError(`Error Code ${content.code}: ${content.message}`, endpoint, res.status)
        case 404: throw new HTTPError(content.message, endpoint, res.status)
        case 429: 
            await new Promise(resolve => setTimeout(resolve, content.retry_after * 1000))
            await this.request(endpoint, reqData)
            break
        }
    }
    async get(endpoint: string, reqData?: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "GET",
            ...reqData
        })
    }
    async head(endpoint: string, reqData?: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "HEAD",
            ...reqData
        })
    }
    async post(endpoint: string, reqData?: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "POST",
            ...reqData
        })
    }
    async put(endpoint: string, reqData?: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "PUT",
            ...reqData
        })
    }
    async delete(endpoint: string, reqData?: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "DELETE",
            ...reqData
        })
    }
    async connect(endpoint: string, reqData: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "CONNECT",
            ...reqData
        })
    }
    async options(endpoint: string, reqData: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "OPTIONS",
            ...reqData
        })
    }
    async trace(endpoint: string, reqData: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "TRACE",
            ...reqData
        })
    }
    async patch(endpoint: string, reqData?: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint,  {
            method: "PATCH",
            ...reqData
        })
    }
}

/* export class WebhookFetch {
    baseURL: string
    constructor() {
        this.baseURL = API_URL+"/webhooks"
    }
    private async request(endpoint: string, reqData?: { method?: HTTPMethods, body?: BodyInit, headers?: BasicJSON }): Promise<Response> {
        if (!reqData.headers) reqData.headers = {}
        if (!reqData.headers["Content-Type"]) reqData.headers["Content-Type"] = "application/json"
        const data = {
            method: reqData.method ?? "GET",
            body: reqData.body
        }
        if (!reqData.body) delete data.body
        // TODO: not a permanent solution
        /* if (this.lastRes) {
            if (this.lastRes.headers["X-RateLimit-Remaining"] === 0) await new Promise(resolve => setTimeout(resolve, this.lastRes.headers["X-RateLimit-Reset"] - Date.now() ))
        } */ /*
        const req = fetch(this.baseURL+endpoint, data), res = await req
        if (res.ok) return res 
        const content = await res.json()
        if (!content) return res 
        process.once("unhandledRejection", e => { throw e })
        switch (res.status) {
        case 400: throw new RESTErrors.BadRequest(`[${reqData.method} ${endpoint}] <Error Code ${content.code}> ${content.message}`)
        case 401: throw new RESTErrors.Denied(`[${reqData.method} ${endpoint}] <Error Code ${content.code}> ${content.message}`)
        case 403: throw new RESTErrors.Forbidden(`[${reqData.method} ${endpoint}] <Error Code ${content.code}> ${content.message}`)
        case 404: throw new RESTErrors.NotFound(content.message)
        case 405: throw new RESTErrors.MethodNotAllowed(`[${reqData.method} ${endpoint}] <Error Code ${content.code}> ${content.message}`)
        case 429: 
            await new Promise(resolve => setTimeout(resolve, content.retry_after * 1000))
            await this.request(endpoint, reqData)
        }
    }
    async get(endpoint: string, reqData?: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "GET",
            ...reqData
        })
    }
    async head(endpoint: string, reqData?: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "HEAD",
            ...reqData
        })
    }
    async post(endpoint: string, reqData?: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "POST",
            ...reqData
        })
    }
    async put(endpoint: string, reqData?: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "PUT",
            ...reqData
        })
    }
    async delete(endpoint: string, reqData?: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "DELETE",
            ...reqData
        })
    }
    async connect(endpoint: string, reqData: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "CONNECT",
            ...reqData
        })
    }
    async options(endpoint: string, reqData: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "OPTIONS",
            ...reqData
        })
    }
    async trace(endpoint: string, reqData: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint, {
            method: "TRACE",
            ...reqData
        })
    }
    async patch(endpoint: string, reqData?: { body?: BodyInit, headers?: BasicJSON }) {
        return this.request(endpoint,  {
            method: "PATCH",
            ...reqData
        })
    }
} */