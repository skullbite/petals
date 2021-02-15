import Base from "./base"
import { DMChannel } from "./channel"
import type RawClient from "../client"
import { avatarURL } from "../http/cdn"
import PetalsFile from "./file"
import type { Guild } from "./guild"
import type Role from "./role"


class User extends Base {
    name: string
    discriminator: string
    bot: boolean
    flags: number
    avatarURL: string
    avatarIsAnimated: boolean
    constructor(data, _bot) {
        super(data.id, _bot)
        const { username, discriminator, bot, flags, avatar } = data
        this.name = username
        this.discriminator = discriminator
        this.bot = bot ? true : false
        this.flags = flags ? flags : 0
        this.avatarIsAnimated = avatar.startsWith("a_")
        this.avatarURL = avatarURL(this.id, discriminator, avatar)
    }
    async send(opts:
            {
                content?: string
                tts?: boolean
                embed?: any
                file?: PetalsFile
            }
            | string
    ) {
        let data: object
        switch (typeof opts) {
        case "string":
            data = { content: opts }
            break
        case "object":
            data = { ...opts }
            break
        }
        const channel = await this._channel
        channel.send(data)
    }
    get _channel(): Promise<DMChannel> {
        return new Promise((res) => {
            let existing
            for (const key of Array.from(this._bot.channels.keys())) {
                const channel = this._bot.channels.get(key)
                if (channel instanceof DMChannel && channel.with.id === this.id)
                    existing = channel
            }
            if (existing) return res(existing)
            else {
                let channel 
                this._bot.http.createDM(this.id).then(r => {
                    channel = r
                })
                this._bot.channels.set(this.id, channel)
                return channel
            }
        })
    }
    get tag() {
        return this.name + "#" + this.discriminator 
    }
    get ping() {
        return `<@${this.id}>`
    }
}

class Member extends User {
    boostedSince?: Date
    joinedAt: Date
    nick?: string
    muted: boolean
    deafened: boolean
    pending: boolean
    from: Guild
    roles: Role[]
    constructor(data, bot) {
        super(data.user, bot)
        const { premium_since, nick, mute, deaf, joined_at, is_pending, guild_id, roles } = data
        this.boostedSince = premium_since
        this.joinedAt = new Date(joined_at)
        this.muted = mute
        this.deafened = deaf
        this.nick = nick
        this.pending = is_pending
        this.from = this._bot.guilds.get(guild_id)
        this.roles = roles.map(d => this.from.roles.get(d))
    }
    async edit(opts: { 
        nick?: string, 
        roles?: Role[], 
        mute?: boolean, 
        deaf?: boolean,
        channel_id?: string
    }) {
        return this._bot.http.editGuildMember(this.from.id, this.id, opts)
    }
    async addRole(roleID: string) {
        return this._bot.http.addGuildRole(this.from.id, this.id, roleID)
    }
    async removeRole(roleID: string) {
        return this._bot.http.removeGuildRole(this.from.id, this.id, roleID)
    }
    async kick() {
        return this._bot.http.removeGuildMember(this.from.id, this.id)
    }
    async ban(opts?: { delete_message_days?: number, reason?: string }) {
        return this._bot.http.createGuildBan(this.from.id, this.id, opts)
    }

}

class WidgetUser extends Base {
    name: string
    discriminator: string
    avatarURL: string
    status: string
    constructor(data, _bot) {
        super(data.id, _bot)
        const { username, discriminator, status, avatar_url } = data
        this.name = username
        this.discriminator = discriminator
        this.status = status
        this.avatarURL = avatar_url
    }
    get tag() {
        return this.name + "#" + this.discriminator 
    }
    get ping() {
        return `<@${this.id}>`
    }
}
// whyyyy oh whyyy
class ClientUser extends Base {
    username: string
    discriminator: string
    bot: boolean
    flags: number
    avatarURL: string
    constructor(data, _bot: RawClient) {
        super(data.id, _bot)
        const { username, discriminator, bot, flags, avatar } = data
        this.username = username
        this.discriminator = discriminator
        this.bot = bot ? true : false
        this.flags = flags ? flags : 0
        this.avatarURL = avatarURL(this.id, discriminator, avatar)
    }
    get tag() {
        return this.username + "#" + this.discriminator
    }
    get ping() {
        return `<@${this.id}>`
    }
}
export { User, Member, WidgetUser, ClientUser }
