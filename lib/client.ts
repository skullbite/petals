import { EventEmitter } from "events"
import { ClientUser, Member } from "./models/user"
import { User } from "./models/user"
import Message from "./models/message"
import HTTP from "./http/static"
import Pile from "./furpile"
import { Guild } from "./models/guild"
import Emoji from "./models/emoji"
import * as e from "./error"
import * as calc from "./utils/intentcalc"
import type PetalsFile from "./models/file"
import * as c from "./models/channel"
import Role from "./models/role"
import Invite from "./models/invite"
import Embed from "./models/embed"
import VoiceState from "./models/voicestate"
import PetalsWS from "./utils/ws"

interface EventData {
    reactionAdd: { message: Message, userID: string, emoji: string|Emoji, member?: Member, channelID: string }
    reactionRemove: { message: Message, userID: string, emoji: string|Emoji, channelID: string }
    reactionRemoveAll: { channel: c.AnyTextable, guild?: Guild, message: Message }
    reactionRemoveEmoji: { channel: c.AnyTextable, guild?: Guild, message: Message, emoji: string|Emoji }
    typing: { message: Message, userID: string, timestamp: Date, channel: c.AnyTextable, guild?: Guild, member?: Member }
}
interface ClientEvents<T> {
    (event: "ready", listener: () => void): T
    (event: "msg"|"msg.delete", listener: (msg: Message) => void): T
    (event: "msg.edit", listener: (before: Message, after: Message) => void): T
    (event: "msg.delete.bulk", listener: (msgs: Message[], channel: c.GuildTextable, guild: Guild) => void): T
    (event: "guild.new"|"guild.edit"|"guild.delete"|"guild.integrations.edit", listener: (guild: Guild) => void): T
    (event: "guild.ban"|"guild.ban.remove", listener: (user: User, guild: Guild) => void): T
    (event: "guild.role.create"|"guild.role.edit"|"guild.role.delete", listener: (role: Role, guild: Guild) => void): T
    (event: "guild.member"|"guild.member.edit"|"guild.member.leave", listener: (member: Member, guild: Guild) => void): T
    (event: "channel.create"|"channel.edit"|"channel.delete", listener: (channel: c.GuildChannels) => void): T
    (event: "channel.pins.edit", listener: (timestamp: Date, channel: c.AnyTextable, guild: Guild) => void): T
    (event: "error", listener: (err: e.RESTErrors) => void): T
    (event: "msg.react", listener: (data: EventData["reactionAdd"]) => void): T
    (event: "msg.react.delete", listener: (data: EventData["reactionRemove"]) => void): T
    (event: "msg.react.remove.all", listener: (data: EventData["reactionRemoveAll"]) => void): T
    (event: "typing", listener: (data: EventData["typing"]) => void): T
    (event: "invite.create", listener: (invite: Invite, channel: c.GuildChannels, guild: Guild) => void): T
    (event: "invite.delete", listener: (invite: string, channel: c.GuildChannels, guild: Guild) => void): T
    (event: "voice.state.edit", listener: (stateData: VoiceState) => void): T
    (event: "webhook.edit", listener: (channel: c.AnyTextable, guild?: Guild) => void): T
}
interface ClientOptions {
    intents?: (keyof typeof calc.wsIntents)[],
    subscriptions?: boolean
    requestAllMembers?: boolean
    largeThreshold?: 250
    fetchAllMembers?: boolean
    reconnect?: boolean
    caching?: {
        channels?: boolean
        guilds?: boolean
        users?: boolean
        members?: boolean
        messages?: boolean
    }
}

class RawClient extends EventEmitter {
    http: HTTP
    ws: PetalsWS
    user: ClientUser
    sessionID: string
    token: string
    guilds: Pile<string, Guild>
    users: Pile<string, User>
    channels: Pile<string, c.AllChannels>
    heartbeatInterval: number
    intents: number
    messages: Pile<string, Message>
    lastSeq: number
    opts: ClientOptions
    on: ClientEvents<this>
    constructor(ClientOptions: ClientOptions) {
        super()
        if (!ClientOptions) throw new Error("No options provided.")
        this.opts = Object.assign({
            intents: ["DIRECT_MESSAGES", "GUILDS", "GUILD_MESSAGES"],
            subscriptions: false,
            requestAllMembers: true,
            largeThreshold: 250,
            reconnect: true,
            caching: {
                channels: true,
                guilds: true,
                users: false,
                members: true, 
                messages: true
            }
        }, ClientOptions)
        this.intents = calc.calculateWSIntents(this.opts.intents)
        this.guilds = new Pile
        this.users = new Pile
        this.channels = new Pile
        this.messages = new Pile
    }
    async send(id: string, opts: {
        content?: string,
        tts?: boolean,
        embed?: Embed,
        file?: PetalsFile
    } | string): Promise<Message> {
        let data
        if (typeof opts === "string") data = { content: opts }
        else {
            data = { ...opts }
            if (data.embed) data.embed = data.embed.toJSON
        } 
        return this.http.sendMessage(id, data)
    }
    changeStatus({ name, type=0, url="", status="online" }: {
        name: string, 
        type: 0|1|2|3|4|5|6, 
        url?: string, 
        status?: "online"|"idle"|"dnd"|"offline"
    }): void {
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
        this.ws.send(JSON.stringify({ op: 3, d: statusData }))
    }
    run(token: string): void {
        this.token = token
        this.ws = new PetalsWS("wss://gateway.discord.gg/?v=8&encoding=json", this)
    }
}

export default RawClient