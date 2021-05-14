import Base from "./base"
import { avatarURL } from "../http/cdn"
import type Role from "./role"
import PetalsPermissions from "./permissions"
import Pile from "../utils/pile"
import FlagHandler from "../utils/flagcalc"
import { MessageOptions } from "./message"

const userFlags = {
    NONE: 0,
    DISCORD_EMPLOYEE: 1 << 0,
    PARTNERED_GUILD_OWNER: 1 << 1,
    HYPESQUAD_EVENTS: 1 << 2,
    BUG_HUNTER_LVL_1: 1 << 3,
    HOUSE_BRAVERY: 1 << 6,
    HOUSE_BRILLIANCE: 1 << 7,
    HOUSE_BALANCE: 1 << 8,
    EARLY_SUPPORTER: 1 << 9,
    TEAM_USER: 1 << 10,
    SYSTEM: 1 << 12,
    BUG_HUNTER_LVL_2: 1 << 14,
    VERIFIED_BOT: 1 << 16,
    EARLY_VERIFIED_BOT_DEVELOPER: 1 << 17
}
export class User extends Base {
    private raw
    name: string
    discriminator: string
    bot: boolean
    flags: FlagHandler
    avatar: string
    avatarIsAnimated: boolean
    constructor(data, _bot) {
        super(data.id, _bot)
        this.raw = data
        const { username, discriminator, bot, public_flags, avatar } = data
        this.name = username
        this.discriminator = discriminator
        this.bot = bot ?? false
        this.flags = public_flags ? new FlagHandler(public_flags, userFlags) : undefined
        this.avatarIsAnimated = avatar ? avatar.startsWith("a_") : false
        this.avatar = avatar
    }
    get avatarURL() {
        return avatarURL(this.id, this.discriminator, this.avatar)
    }
    get getRaw() {
        return this.raw
    }
    async send(opts: MessageOptions | string) {
        const data = typeof opts === "string" ? { content: opts } : opts    
        const channel = await this._channel()
        return channel.send(data)
    }
    private async _channel() {
        return this._bot.http.createDM(this.id)
    }
    get tag() {
        return this.name + "#" + this.discriminator 
    }
    get ping() {
        return `<@${this.id}>`
    }
}

export class TeamMember extends User {
    teamID: string
    permissions: string[]
    membershipState: number
    constructor(data, bot) {
        super(data.user, bot)
        const { permissions, team_id, membership_state } = data
        this.permissions = permissions
        this.teamID = team_id
        this.membershipState = membership_state
    }
}
export class Member extends User {
    private rawData
    boostedSince?: Date
    joinedAt: Date
    nick?: string
    muted: boolean
    deafened: boolean
    pending: boolean
    fromID: string
    hoistedID?: string
    roles: Pile<string, Role>
    permissions: PetalsPermissions
    constructor(data, bot) {
        super(data.user, bot)
        const { premium_since, nick, mute, deaf, joined_at, is_pending, guild_id, roles, hoisted_role } = data
        this.rawData = data
        this.boostedSince = new Date(premium_since)
        this.joinedAt = new Date(joined_at)
        this.muted = mute
        this.deafened = deaf
        this.nick = nick
        this.pending = is_pending
        this.hoistedID = hoisted_role
        this.fromID = guild_id
        this.roles = new Pile
        roles.map(d => this.roles.set(d, this.from.roles.get(d)))
        let n = 0n
        Array.from(this.roles.values()).map(d => n |= d.permissions.bitset)
        this.permissions = new PetalsPermissions(n)
    }
    get from() {
        return this._bot.guilds.get(this.fromID)
    }
    get hoistedRole() {
        return this.from.roles.get(this.hoistedID)
    }
    get topRole() {
        const p = Array.from(this.roles.values()).map(d => d.position)
        return this.roles.getFirst(r => Math.max(...p) === r.position)
    }
    get getRaw() {
        return this.rawData
    }
    async edit(opts: { 
        nick?: string, 
        roles?: Role[], 
        mute?: boolean, 
        deaf?: boolean,
        channel_id?: string
    }, reason?: string) {
        return this._bot.http.editGuildMember(this.from.id, this.id, opts, reason ?? "")
    }
    async addRole(roleID: string, reason?: string) {
        return this._bot.http.addGuildRole(this.from.id, this.id, roleID, reason ?? "")
    }
    async removeRole(roleID: string, reason?: string) {
        return this._bot.http.removeGuildRole(this.from.id, this.id, roleID, reason ?? "")
    }
    async kick(reason?: string) {
        return this._bot.http.removeGuildMember(this.fromID, this.id, reason ?? "")
    }
    async ban(opts?: { delete_message_days?: number, reason?: string }) {
        return this._bot.http.createGuildBan(this.fromID, { userID: this.id, body: opts })
    }

}

export class WidgetUser extends Base {
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

export class ClientUser extends User {
    async edit(body: {
        username?: string,
        avatar?: Buffer
    }) {
        return this._bot.http.editCurrentUser(body)
    }
}