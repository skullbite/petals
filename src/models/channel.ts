import Base from "./base"
import Pile from "../utils/pile"
import type RawClient from "../client"
import { MessageOptions } from "./message"
import PermissionOverwrite from "./permissionoverwrite"
import { channelTypes } from "../http/requests"
import { User } from "./user"

export class PartialChannel extends Base {
    name: string
    type: string
    constructor(data, bot: RawClient) {
        super(data.id, bot)
        const { name, type } = data
        this.name = name
        const obj = {}
        Array.from(Object.keys(channelTypes).entries()).forEach(d => obj[d[0]] = d[1])
        this.type = obj[type]
    }
}
abstract class GuildChannel extends PartialChannel {
    fromID: string
    position: number
    overwrites: Pile<string, PermissionOverwrite>
    constructor(data, bot) {
        super(data, bot)
        const { permission_overwrites, position, guild_id } = data
        this.overwrites = new Pile
        permission_overwrites.map((d) => this.overwrites.set(d.id, new PermissionOverwrite(d)))
        this.position = position
        this.fromID = guild_id
    }
    get from() {
        return this._bot.guilds.get(this.fromID)
    }
    get tag() {
        return `<#${this.id}>`
    }
    async delete() {
        await this._bot.http.deleteChannel(this.id)
    }
    async editPermissionOverwrite(overwrite: PermissionOverwrite, newOverwrite: PermissionOverwrite) {
        await this._bot.http.editChannelPermissions(this.id, overwrite.id, newOverwrite)
    }
    async deletePermissionOverwrite(overwrite: PermissionOverwrite) {
        await this._bot.http.deleteChannelPermissions(this.id, overwrite.id)
    }
    async edit(opts: {
        name?: string,
        type?: keyof typeof channelTypes,
        position?: number,
        topic?: string,
        nsfw?: boolean,
        rate_limit_per_user?: number,
        bitrate?: number,
        user_limit?: number
        permission_overwrites?: PermissionOverwrite[]
        parent_id?: string
    }) {
        return this._bot.http.editChannel(this.id, opts)
    }
}
export class ChannelCategory extends GuildChannel {}

export class TextChannel extends GuildChannel {
    topic?: string
    slowModeRateLimit?: number
    categoryID?: string
    nsfw: boolean
    lastMessageID?: string
    constructor(data, bot) {
        super(data, bot)
        this._bot = bot
        const {
            topic,
            rate_limit_per_user,
            parent_id,
            nsfw,
            last_message_id
        } = data
        this.topic = topic
        this.slowModeRateLimit = rate_limit_per_user
        this.categoryID = parent_id
        this.nsfw = nsfw ?? false
        this.lastMessageID = last_message_id
    }
    async createInvite(opts: {
        max_age?: number,
        max_uses?: number,
        temporary?: boolean,
        unique?: boolean,
        target_user?: string
        reason?: string
    }) {
        return this._bot.http.createChannelInvite(this.id, opts, opts?.reason)
    }
    async deleteInvite(inviteCode: string, reason?: string) {
        await this._bot.http.deleteInvite(inviteCode, reason)
    }
    async getInvites() {
        return this._bot.http.getChannelInvites(this.id)
    }
    async getPins() {
        return this._bot.http.getPinnedMessages(this.id)
    }
    async fetchMessage(messageID: string) {
        return this._bot.http.getMessage(this.id, messageID)
    }
    async pin(messageID: string) {
        await this._bot.http.addPinnedMessage(this.id, messageID)
    }
    async unpin(id: string) {
        await this._bot.http.deletePinnedMessage(this.id, id)
    }
    async typing() {
        await this._bot.http.sendTyping(this.id)
    }
    async bulkDelete({ messageIDs, limit, query }: { messageIDs?: string[], limit?: number, query?: { before?: string, around?: string, after?: string } }) {
        if (messageIDs) {
            await this._bot.http.bulkDeleteMessages(this.id, messageIDs)
            return
        }
        else if (limit && query) {
            const m = await this._bot.http.getMessages(this.id, query, limit)
            await this._bot.http.bulkDeleteMessages(this.id, m.map(d => d.id))
        }
        else throw new Error("Must provide message IDs or a limit and a query.")
    }
    async send(opts: MessageOptions | string) {
        const data = typeof opts === "string" ? { content: opts } : opts
        return this._bot.http.sendMessage(this.id, data, this._bot)
    }
}

export class NewsChannel extends TextChannel {
    constructor(data, bot) {
        super(data, bot)
    }
    async crosspost(messageID: string) {
        return this._bot.http.crosspostMessage(this.id, messageID)
    }
}

export class VoiceChannel extends GuildChannel {
    userLimit?: number
    categoryID?: string
    bitrate?: string
    constructor(data, bot: RawClient) {
        super(data, bot)
        const {
            user_limit,
            parent_id,
            bitrate
        } = data
        this.userLimit = user_limit
        this.categoryID = parent_id
        this.bitrate = bitrate
    }
    connect(mute?: boolean, deaf?: boolean) {
        this._bot.shards.get(this.from.shardID).ws.send(JSON.stringify({ op: 4, d: { guild_id: this.fromID, channel_id: this.id, self_mute: mute ?? false, self_deaf: deaf ?? false } }))
    }
    async createInvite(opts: {
        max_age?: number,
        max_uses?: number,
        temporary?: boolean,
        unique?: boolean,
        target_user?: string
        reason?: string
    }) {
        return this._bot.http.createChannelInvite(this.id, opts, opts?.reason)
    }
    async deleteInvite(inviteCode: string, reason?: string) {
        await this._bot.http.deleteInvite(inviteCode, reason)
    }
    async getInvites() {
        return this._bot.http.getChannelInvites(this.id)
    }
}

export class DMChannel extends Base {
    with: User
    constructor(data, bot) {    
        super(data.id, bot)
        this.with = new User(data.recipients[0], bot)
    }
    async getPins() {
        return this._bot.http.getPinnedMessages(this.id)
    }
    async delete() {
        this._bot.http.deleteChannel(this.id)
    }
    async typing() {
        await this._bot.http.sendTyping(this.id)
    }
    async send(opts: MessageOptions | string) {
        const data = typeof opts === "string" ? { content: opts } : opts
        return this._bot.http.sendMessage(this.id, data, this._bot)
    }
}

export class StoreChannel extends GuildChannel {
    nsfw: boolean
    categoryID: string
    constructor(data, bot: RawClient) {
        super(data, bot)
        const { nsfw, parent_id } = data
        this.nsfw = nsfw ?? false
        this.categoryID = parent_id
    }
    async createInvite(opts: {
        max_age?: number,
        max_uses?: number,
        temporary?: boolean,
        unique?: boolean,
        target_user?: string
        reason?: string
    }) {
        return this._bot.http.createChannelInvite(this.id, opts, opts?.reason)
    }
    async deleteInvite(inviteCode: string, reason?: string) {
        await this._bot.http.deleteInvite(inviteCode, reason)
    }
    async getInvites() {
        return this._bot.http.getChannelInvites(this.id)
    }
}

export class StageChannel extends GuildChannel {
    topic?: string
    categoryID?: string
    bitrate: number
    userLimit: number
    rtcRegion?: string
    constructor(data, bot) {
        super(data, bot)
        const { topic, parent_id, bitrate, user_limit, rtc_region } = data
        this.topic = topic
        this.categoryID = parent_id
        this.bitrate = bitrate
        this.userLimit = user_limit
        this.rtcRegion = rtc_region
    }
    async createInvite(opts: {
        max_age?: number,
        max_uses?: number,
        temporary?: boolean,
        unique?: boolean,
        target_user?: string
        reason?: string
    }) {
        return this._bot.http.createChannelInvite(this.id, opts, opts?.reason)
    }
    async deleteInvite(inviteCode: string, reason?: string) {
        await this._bot.http.deleteInvite(inviteCode, reason)
    }
    async getInvites() {
        return this._bot.http.getChannelInvites(this.id)
    }
}

export class ThreadChannel extends GuildChannel {
    parentID: string
    ownerID: string
    messageCount: number
    memberCount: number
    lastMessageID: string
    ratelimitPerUser?: number
    meta: {
        archived: boolean
        locked: boolean
        auto_archive_duration: number
        archive_timestamp: Date
    }
    constructor(data, bot) {
        super(data, bot)
        const { parent_id, owner_id, message_count, member_count, rate_limit_per_user, thread_metadata } = data
        this.parentID = parent_id
        this.ownerID = owner_id
        this.messageCount = message_count
        this.memberCount = member_count
        this.ratelimitPerUser = rate_limit_per_user
        this.meta = thread_metadata
        this.meta.archive_timestamp = new Date(this.meta.archive_timestamp)
    }
    get parent() {
        return this.from.channels.get(this.parentID)
    }
} 
 
export type GuildTextable = TextChannel|NewsChannel|ThreadChannel
export type GuildChannels = TextChannel|NewsChannel|VoiceChannel|ChannelCategory|StoreChannel|StageChannel|ThreadChannel
export type AnyTextable = TextChannel|NewsChannel|DMChannel|ThreadChannel
export type AllChannels = TextChannel|NewsChannel|VoiceChannel|ChannelCategory|StoreChannel|DMChannel|StageChannel|ThreadChannel