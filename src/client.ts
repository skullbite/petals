import { EventEmitter } from "events"
import { ClientUser, Member } from "./models/user"
import { User } from "./models/user"
import Message from "./models/message"
import HTTP from "./http/requests"
import Pile from "./utils/pile"
import { Guild } from "./models/guild"
import Emoji from "./models/emoji"
import * as e from "./errors"
import * as calc from "./utils/intentcalc"
import type PetalsFile from "./utils/file"
import * as c from "./models/channel"
import Role from "./models/role"
import Invite from "./models/invite"
import Embed from "./models/embed"
import VoiceState from "./models/voicestate"
import PetalsWS from "./ws"
import Shard from "./models/shard"
import PetalsPermissions from "./models/permissions"
interface EventData {
    reactionAdd: { message: Message, userID: string, emoji: string|Emoji, member?: Member, channelID: string }
    reactionRemove: { message: Message, userID: string, emoji: string|Emoji, channelID: string }
    reactionRemoveAll: { channel: c.AnyTextable, guild?: Guild, message: Message }
    reactionRemoveEmoji: { channel: c.AnyTextable, guild?: Guild, message: Message, emoji: string|Emoji }
    typing: { message: Message, userID: string, timestamp: Date, channel: c.AnyTextable, guild?: Guild, member?: Member }
}
export type statusTypes = "online"|"idle"|"dnd"|"offline"
export interface ClientEvents<T> {
    (event: "shard.ready"|"shard.close"|"ack", listener: (shardID: number) => void): T
    (event: "ready"|"resume", listener: () => void): T
    (event: "msg"|"msg.delete", listener: (msg: Message) => void): T
    (event: "msg.edit", listener: (before: Message, after: Message) => void): T
    (event: "msg.delete.bulk", listener: (msgs: Message[], channel: c.GuildTextable, guild: Guild) => void): T
    (event: "guild.new"|"guild.edit"|"guild.delete"|"guild.integrations.edit", listener: (guild: Guild) => void): T
    (event: "guild.ban"|"guild.ban.remove", listener: (user: User, guild: Guild) => void): T
    (event: "guild.role.create"|"guild.role.edit"|"guild.role.delete", listener: (role: Role, guild: Guild) => void): T
    (event: "guild.member"|"guild.member.edit"|"guild.member.leave", listener: (member: Member, guild: Guild) => void): T
    (event: "channel.create"|"channel.edit"|"channel.delete", listener: (channel: c.GuildChannels) => void): T
    (event: "channel.pins.edit", listener: (timestamp: Date, channel: c.AnyTextable, guild: Guild) => void): T
    (event: "error"|"error.rest", listener: (err: e.RESTErrors) => void): T
    (event: "msg.react", listener: (data: EventData["reactionAdd"]) => void): T
    (event: "msg.react.delete", listener: (data: EventData["reactionRemove"]) => void): T
    (event: "msg.react.remove.all", listener: (data: EventData["reactionRemoveAll"]) => void): T
    (event: "typing", listener: (data: EventData["typing"]) => void): T
    (event: "invite.create", listener: (invite: Invite, channel: c.GuildChannels, guild: Guild) => void): T
    (event: "invite.delete", listener: (invite: string, channel: c.GuildChannels, guild: Guild) => void): T
    (event: "voice.state.edit", listener: (stateData: VoiceState) => void): T
    (event: "webhook.edit", listener: (channel: c.GuildTextable, guild: Guild) => void): T
}
export interface ClientOptions {
    intents?: calc.wsKeys[] | number
    shardCount?: "auto" | number
    subscriptions?: boolean
    requestAllMembers?: boolean
    largeThreshold?: 250
    reconnect?: boolean
    caching?: {
        channels?: boolean
        guilds?: boolean
        users?: boolean
        members?: boolean
        messages?: boolean
    }
}

export default class RawClient extends EventEmitter {
    http: HTTP
    user: ClientUser
    sessionID: string
    token: string
    guilds: Pile<string, Guild>
    users: Pile<string, User>
    channels: Pile<string, c.AllChannels>
    heartbeatInterval: number
    shards: Pile<number, Shard>
    intents: number
    messages: Pile<string, Message>
    lastSeq: number
    _allShardsReady: boolean
    _shardsReady: number
    opts: ClientOptions
    on: ClientEvents<this>
    constructor(ClientOptions: ClientOptions) {
        super()
        if (!ClientOptions) throw new Error("No options provided.")
        this.opts = Object.assign({
            intents: ["DIRECT_MESSAGES", "GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGE_REACTIONS"],
            subscriptions: false,
            shardCount: "auto",
            requestAllMembers: true,
            largeThreshold: 250,
            reconnect: true,
            caching: {
                channels: true,
                guilds: true,
                users: false,
                messages: true
            }
        }, ClientOptions)
        this._allShardsReady = false
        this._shardsReady = 0
        this.intents = this.opts.intents instanceof Array ? calc.calculateWSIntents(this.opts.intents) : this.opts.intents
        this.guilds = new Pile
        this.users = new Pile
        this.channels = new Pile
        this.messages = new Pile
        this.shards = new Pile
        this.on("shard.ready", () => this._shardsReady++)
        this.on("error.rest", e => console.error(e))
        this.on("shard.close", (shardID) => {
            this.shards.delete(shardID)
            this._shardsReady--
        })
    }
    async send(id: string, opts: {
        content?: string,
        tts?: boolean,
        embed?: Embed,
        file?: PetalsFile,
        nonce?: string | number 
    } | string) {
        let data
        if (typeof opts === "string") data = { content: opts }
        else {
            data = { ...opts }
            if (data.embed) data.embed = data.embed.toJSON
        } 
        return this.http.sendMessage(id, data, this)
    }
    async changeStatus({ name, type=0, url="", status="online" }: {
        name: string, 
        type?: 0|1|2|3|4|5|6, 
        url?: string, 
        status?: statusTypes
    }): Promise<void> {
        const statusData = {
            since: 91879201,
            activities: [{
                name: name,
                type: type,
                url: url
            }],
            status: status,
            afk: false
        }
        statusData.activities[0].url === "" ? delete statusData.activities[0].url : {}
        Array.from(this.shards.values()).map(d => d.ws.send(JSON.stringify({ op: 3, d: statusData })))
    }
    async fetchThisUser() {
        return this.http.fetchCurrentUser()
    }
    async fetchUser(userID: string) {
        return this.http.fetchUser(userID)
    }
    async getAppInfo() {
        return this.http.getAppInfo()
    }
    async fetchGuild(guildID: string, withCounts?: boolean) {
        return this.http.getGuild(guildID, withCounts ?? false)
    }
    async fetchGuildPreview(guildID: string) {
        return this.http.getGuildPreview(guildID)
    }
    async fetchChannel(channelID: string) {
        return this.http.getChannel(channelID)
    }
    async createGuild(body: {
        name: string,
        region?: string,
        icon?: Buffer,
        verification_level?: 0|1|2|3|4,
        default_message_notifications?: 0|1,
        explicit_content_filter?: 0|1|2,
        roles?: {
            name?: string,
            color: number,
            hoist?: boolean,
            mentionable?: boolean,
            permissions?: PetalsPermissions
        }[],
        channels?: {
            name: string,
            type: 0|2|4|5|6
        },
        afk_channel_id?: string,
        afk_timeout?: number,
        system_channel_id?: string
    }) {
        return this.http.createGuild(body)
    }
    async getInvite(inviteCode: string, withCounts?: boolean) {
        return this.http.getInvite(inviteCode, withCounts ?? false)
    }
    async leaveGuild(guildID: string) {
        await this.http.leaveGuild(guildID)
    }
    async getBotGateway() {
        return this.http.getBotGateway()
    }
    async run(token: string): Promise<void> {
        this.token = token
        this.http = new HTTP(this)
        let totalShards: number
        if (this.opts.shardCount === "auto") { 
            try {
                const res = await this.getBotGateway()
                totalShards = res.shards
            }
            catch {
                throw new Error("Invalid token provided! Cannot login.")
            }
        }
        else totalShards = this.opts.shardCount
        if (totalShards <= 0) throw new Error("Invalid shard count provided!")
        for (let i = 0; i < totalShards; i++) {
            const ws = new PetalsWS(this, i, totalShards)
            this.shards.set(i, new Shard(i, ws, this)) 
            await new Promise(resolve => setTimeout(resolve, 6e3))
        }
        this.opts.shardCount = totalShards
    }
}