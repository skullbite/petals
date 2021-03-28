import fetch, { BodyInit, Response } from "node-fetch"
import * as RESTErrors from "../errors"
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

export default class PetalsFetch {
    baseURL: string
    headers: BasicJSON
    constructor(baseURL: string, headers: BasicJSON) {
        this.baseURL = baseURL
        this.headers = headers
    }
    async request(endpoint: string, reqData?: { method?: HTTPMethods, body?: BodyInit, headers?: BasicJSON }): Promise<Response> {
        if (!reqData.headers) reqData.headers = {}
        if (!reqData.headers["Content-Type"]) reqData.headers["Content-Type"] = "application/json"
        const data = {
            method: reqData.method ?? "GET",
            headers: { 
                ...(reqData.headers ?? {}),
                ...this.headers
            },
            body: reqData.body
        }
        if (!reqData.body) delete data.body
        const req = fetch(this.baseURL+endpoint, data), res = await req
        if (res.ok) return res
        const content = await res.json()
        if (!content) return res
        switch (res.status) {
        case 400: throw new RESTErrors.BadRequest(`<Error Code ${content.code}> ${content.message}`)
        case 401: throw new RESTErrors.Unauthorized(`<Error Code ${content.code}> ${content.message}`)
        case 403: throw new RESTErrors.Forbidden(`<Error Code ${content.code}> ${content.message}`)
        case 404: throw new RESTErrors.NotFound(content.message)
        case 405: throw new RESTErrors.MethodNotAllowed(`<Error Code ${content.code}> ${content.message}`)
        case 429: 
            await new Promise(resolve => setTimeout(resolve, content.retry_after * 1000))
            throw new RESTErrors.Ratelimited(content.message)
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