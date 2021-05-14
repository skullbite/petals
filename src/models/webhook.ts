import { avatarURL } from "../http/cdn"
import PetalsFile from "../utils/file"
import Base from "./base"
import Embed from "./embed"
import { User } from "./user"

const WHtypes = {
    1: "INCOMING",
    2: "CHANNEL_FOLLOWER"
}
export class Webhook extends Base {
    type: string
    fromID?: string
    channelID: string
    user?: User
    name: string
    token: string
    avatar?: string
    applicationID?: string
    constructor(data, bot) {
        super(data.id, bot)
        const { type, guild_id, channel_id, user, name, avatar, application_id } = data
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
    get avatarURL() {
        return avatarURL(this.id, "0000", this.avatar)
    }
    async edit(body: {
        name?: string,
        avatar_url?: Buffer,
        channel_id?: string
    }) {
        if (!this.user) {
            if (body.channel_id) throw new Error("To alter the webhook channel ID, the webhook much be fetch from guild or channel.")
            return this._bot.http.modifyWebhookWithToken(this.id, this.token, body)
        }
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
