import { Client } from "../.."
import { avatarURL } from "../http/cdn"
import PetalsFile from "../utils/file"
import Base from "./base"
import Embed from "./embed"
import { User } from "./user"
import { WebhookHTTP } from "../http/requests"

const WHtypes = {
    1: "INCOMING",
    2: "CHANNEL_FOLLOWER"
}
export default class Webhook extends Base {
    type: string
    fromID?: string
    channelID: string
    user?: User
    name: string
    token: string
    avatar?: string
    applicationID?: string
    constructor(data, bot: Client) {
        super(data.id, bot)
        const { type, token, guild_id, channel_id, user, name, avatar, application_id } = data
        this.token = token
        this.type = WHtypes[type]
        this.fromID = guild_id
        this.channelID = channel_id
        this.user = new User(user, this._bot)
        this.name = name
        this.avatar = avatar
        this.applicationID = application_id
    }
    get from() {
        return this._bot.guilds.get(this.fromID)
    }
    get channel() {
        return this.from.channels.get(this.channelID)
    }
    get avatarURL() {
        return avatarURL(this.id, "0000", this.avatar)
    }
    async edit(body: {
        name?: string,
        avatar_url?: Buffer,
        channel_id?: string
    }) {
        return this._bot.http.modifyWebhook(this.id, body)
    }
    async delete() {
        if (!this.user) return this._bot.http.deleteWebhookWithToken(this.id, this.token)
        return this._bot.http.deleteWebhook(this.id)
    }
    async send(opts: {
        content?: string,
        username?: string,
        wait?: boolean,
        avatar_url?: string,
        tts?: boolean,
        file?: PetalsFile,
        embeds?: Embed[],
        allowed_mentions?: { 
            parse?: "everyone" | "roles" | "users"[], 
            users?: string[], 
            roles?: string[] 
        }
    } | string) {
        const data = typeof opts === "string" ? { content: opts } : opts
        return this._bot.http.executeWebhook(this.id, this.token, data)
    }
    async editMessage(messageID: string, body: {
        content?: string,
        embeds?: Embed[],
        file?: PetalsFile,
        wait?: boolean,
        allowed_mentions?: { 
            parse?: "everyone" | "roles" | "users"[], 
            users?: string[], 
            roles?: string[] 
        }
    }) {
        return this._bot.http.editWebhookMessage(this.id, this.token, messageID, body)
    }
    async deleteMessage(messageID: string) {
        return this._bot.http.deleteWebhookMessage(this.id, this.token, messageID)
    }
}

export class WebhookFromToken {
    id: string
    createdAt: Date
    token: string
    http: WebhookHTTP
    constructor(id: string, token: string) {
        this.id = id
        this.http = new WebhookHTTP()
        this.createdAt = new Date(Math.floor(Number((BigInt(id) / 4194304n) + 1420070400000n)))
        this.token = token
    }
    async edit(body: {
        name?: string,
        avatar_url?: Buffer,
        channel_id?: string
    }) {
        return this.http.modifyWebhook(this.id, this.token, body)
    }
    async delete() {
        return this.http.deleteWebhook(this.id, this.token)
    }
    async send(opts: {
        content?: string,
        username?: string,
        wait?: boolean,
        avatar_url?: string,
        tts?: boolean,
        file?: PetalsFile,
        embeds?: Embed[],
        allowed_mentions?: { 
            parse?: "everyone" | "roles" | "users"[], 
            users?: string[], 
            roles?: string[] 
        }
    } | string) {
        const data = typeof opts === "string" ? { content: opts } : opts
        await this.http.executeWebhook(this.id, this.token, data)
    }
    async editMessage(messageID: string, body: {
        content?: string,
        embeds?: Embed[],
        file?: PetalsFile,
        wait?: boolean,
        allowed_mentions?: { 
            parse?: "everyone" | "roles" | "users"[], 
            users?: string[], 
            roles?: string[] 
        }
    }) {
        return this.http.editWebhookMessage(this.id, this.token, messageID, body)
    }
    async deleteMessage(messageID: string) {
        await this.http.deleteWebhookMessage(this.id, this.token, messageID)
    }
}
