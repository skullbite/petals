import Base from "./base"
import Pile from "../furpile"
import type RawClient from "../client"
import { User } from "./user"
import type { Guild } from "./guild"
import type PetalsFile from "./file"
import type Message from "./message"
import PermissionOverwrite from "./permissionoverwrite"
import Invite from "./invite"


class ChannelCategory extends Base {
    overwrites: Pile<string, PermissionOverwrite>
    name: string
    position: number
    guildID: string
    constructor(data, bot: RawClient) {
        super(data.id, bot)
        this.guildID = data.guild_id
        const { permission_overwrites, name, position } = data
        this.overwrites = new Pile
        permission_overwrites.forEach((d: { id: string, type: number, allow: string, deny: string }) => this.overwrites.set(d.id, new PermissionOverwrite(d)))
        this.name = name
        this.position = position
    }
    async editPermissionOverwrite(overwrite: PermissionOverwrite, newOverwrite: PermissionOverwrite) {
        await this._bot.http.editChannelPermissions(this.id, overwrite.id, newOverwrite)
    }
    async deletePermissionOverwrite(overwrite: PermissionOverwrite) {
        await this._bot.http.deleteChannelPermissions(this.id, overwrite.id)
    }

    async edit(opts: {
        name?: string,
        type?: 0|2|4|5|6,
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

class PartialChannel extends Base {
    name: string
    type: number
    constructor(data, bot: RawClient) {
        super(data.id, bot)
        const { name, type } = data
        this.name = name
        this.type = type    
    }
}

class TextChannel extends Base {
    topic?: string
    slowModeRateLimit?: number
    position: number
    overwrites: Pile<string, PermissionOverwrite>
    categoryID?: string
    nsfw: boolean
    name: string
    lastMessageID?: string
    guildID: string
    constructor(data, bot: RawClient) {
        super(data.id, bot)
        this._bot = bot
        this.guildID = data.guild_id
        const {
            topic,
            rate_limit_per_user,
            position,
            permission_overwrites,
            parent_id,
            nsfw,
            name,
            last_message_id
        } = data
        this.topic = topic
        this.slowModeRateLimit = rate_limit_per_user
        this.position = position
        this.overwrites = new Pile
        permission_overwrites.forEach(d => this.overwrites.set(d.id, new PermissionOverwrite(d)))
        this.categoryID = parent_id
        this.nsfw = nsfw
        this.name = name
        this.lastMessageID = last_message_id
    }

    get mention() {
        return `<#${this.id}>`
    }

    get pins() {
        let pins: Message[]
        this._bot.http.getPinnedMessages(this.id).then(d => pins = d)
        return pins
    }
    
    get invites() {
        let invites: Invite[]
        this._bot.http.getChannelInvites(this.id).then(d => invites = d)
        return invites
    }
    async pin(id: string) {
        await this._bot.http.addPinnedMessage(this.id, id)
    }

    async unpin(id: string) {
        await this._bot.http.deletePinnedMessage(this.id, id)
    }

    async delete() {
        await this._bot.http.deleteChannel(this.id)
    }

    async typing() {
        await this._bot.http.sendTyping(this.id)
    }

    async bulkDelete(messageIDs: string[]) {
        await this._bot.http.bulkDeleteMessages(this.id, messageIDs)
    }

    async editPermissionOverwrite(current: string, newOverwrite: PermissionOverwrite) {
        await this._bot.http.editChannelPermissions(this.id, current, newOverwrite)
    }

    async deletePermissionOverwrite(overwrite: PermissionOverwrite) {
        await this._bot.http.deleteChannelPermissions(this.id, overwrite.id)
    }

    async edit(opts: {
        name?: string,
        type?: 0|2|4|5|6,
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

    async makeInvite(opts: {
        max_age?: number,
        max_uses?: number,
        temporary?: boolean,
        unique?: boolean,
        target_user?: string
    }) {
        return this._bot.http.createChannelInvite(this.id, opts)
    }

    async send?(opts: {
        content?: string,
        tts?: boolean,
        embed?: any,
        file?: PetalsFile
        } | string) {
        let data: object
        switch (typeof opts) {
        case "string":
            data = { content: opts }
            break
        case "object":
            data = { ...opts }
            break
        }
        return this._bot.http.sendMessage(this.id, data)
    }
}

class NewsChannel extends TextChannel {
    constructor(data, bot: RawClient) {
        super(data, bot)
    }
    
    async crosspost(messageID: string) {
        return this._bot.http.crosspostMessage(this.id, messageID)
    }
}

class VoiceChannel extends Base {
    userLimit?: number
    position: number
    overwrites: Pile<string, PermissionOverwrite>
    categoryID?: string
    name: string
    bitrate?: string
    guildID: string
    constructor(data, bot: RawClient) {
        super(data.id, bot)
        this.guildID = data.guild_id
        const {
            user_limit,
            position,
            permission_overwrites,
            parent_id,
            name,
            bitrate
        } = data
        this.userLimit = user_limit
        this.position = position
        this.overwrites = new Pile
        permission_overwrites.forEach((d: { id: string, type: number, allow: string, deny: string }) => this.overwrites.set(d.id, new PermissionOverwrite(d)))
        this.categoryID = parent_id
        this.name = name
        this.bitrate = bitrate
    }
    async edit(opts: {
        name?: string,
        type?: 0|2|4|5|6,
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
    async delete() {
        this._bot.http.deleteChannel(this.id)
    }
    async makeInvite(opts: {
        max_age?: number,
        max_uses?: number,
        temporary?: boolean,
        unique?: boolean,
        target_user?: string
    }) {
        return this._bot.http.createChannelInvite(this.id, opts)
    }
}

class DMChannel extends Base {
    with: User
    id: string
    constructor(data, bot) {    
        const { recipients, id } = data
        super(id, bot)
        // this.with = new User(recipients[0], this._bot)
    }
    get pins() {
        let pins: Message[]
        this._bot.http.getPinnedMessages(this.id).then(d => pins = d)
        return pins
    }

    async delete() {
        this._bot.http.deleteChannel(this.id)
    }
    async typing() {
        await this._bot.http.sendTyping(this.id)
    }
    async send(opts: {
        content?: string,
        tts?: boolean,
        embed?: any,
        file?: PetalsFile
        } | string) {
        let data
        if (typeof opts === "string") data = { content: opts }
        else {
            data = { ...opts }
            if (data.embed) data.embed = data.embed.toJSON
        } 
        return this._bot.http.sendMessage(this.id, data)
    }
}

class StoreChannel extends Base {
    name: string
    position: number
    overwrites: Pile<string, PermissionOverwrite>
    nsfw: boolean
    categoryID: string
    guildID: string
    constructor(data, bot: RawClient) {
        super(data.id, bot)
        this.guildID = data.guild_id
        const { name, position, permission_overwrites, nsfw, parent_id } = data
        this.name = name
        this.position = position
        this.overwrites = new Pile
        permission_overwrites.forEach((d: { id: string, type: number, allow: string, deny: string }) => this.overwrites.set(d.id, new PermissionOverwrite(d)))
        this.nsfw = nsfw
        this.categoryID = parent_id
    }
    get mention() {
        return `<#${this.id}>`
    }

    get pins() {
        let pins: Message[]
        this._bot.http.getPinnedMessages(this.id).then(d => pins = d)
        return pins
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
        type?: 0|2|4|5|6,
        position?: number,
        topic?: string,
        nsfw?: boolean,
        rate_limit_per_user?: number,
        bitrate?: number,
        user_limit?: number
        permission_overwrites?: PermissionOverwrite[]
        parent_id?: string
    }){
        return this._bot.http.editChannel(this.id, opts)
    }
    
    async makeInvite(opts: {
        max_age?: number,
        max_uses?: number,
        temporary?: boolean,
        unique?: boolean,
        target_user?: string
    }) {
        return this._bot.http.createChannelInvite(this.id, opts)
    }
}

type GuildTextable = TextChannel|NewsChannel
type GuildChannels = TextChannel|NewsChannel|VoiceChannel|ChannelCategory|StoreChannel
type AnyTextable = TextChannel|NewsChannel|DMChannel
type AllChannels = TextChannel|NewsChannel|VoiceChannel|ChannelCategory|StoreChannel|DMChannel

export { 
    PartialChannel, 
    TextChannel, 
    VoiceChannel, 
    DMChannel, 
    StoreChannel, 
    ChannelCategory, 
    NewsChannel, 
    GuildTextable, 
    GuildChannels, 
    AnyTextable, 
    AllChannels 
}