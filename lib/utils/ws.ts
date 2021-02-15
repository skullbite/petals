import * as ws from "ws"
import type RawClient from "../client"
import HTTP from "../http/static"
import * as c from "../models/channel"
import Emoji from "../models/emoji"
import { Guild } from "../models/guild"
import Invite from "../models/invite"
import Message from "../models/message"
import Role from "../models/role"
import { User, Member, ClientUser } from "../models/user"
import VoiceState from "../models/voicestate"

class PetalsWS extends ws {
    private readonly bot: RawClient
    loginPayload: {
        token: string,
        properties: {
            $os: string,
            $browser: string,
            $device: string
        },
        intents: number,
        large_threshold: number,
        guild_subscriptions: boolean
    }
    constructor(address: string, bot: RawClient) {
        super(address)
        this.bot = bot
        this.loginPayload = {
            token: this.bot.token,
            properties: {
                $os: process.platform,
                $browser: "Cutie Flowers",
                $device: "Petals"
            },
            intents: this.bot.intents,
            large_threshold: this.bot.opts.largeThreshold,
            guild_subscriptions: this.bot.opts.subscriptions
        }
        this.on("close", (d: number) => {
            switch (d) {
            case 4001: throw new Error("Invalid opcode! This isn't supposed to happen.")
            case 4004: throw new Error("Invalid token provided! Cannot login.")
            case 4002: throw new Error("Invalid payload! This isn't supposed to happen.")
            case 4013: throw new Error("Invalid intents sent!")
            case 4014: throw new Error("Disallowed intents provided! Are you whitelisted for ALL intents you specified?")
            default: throw new Error(`${d}: Session Closed`)
            }
        })
        this.on("message", (d: string): void => {
            const data: {
                op: number
                d: { [x: string]: any }
                s?: number
                t?: string
            } = JSON.parse(d)
            switch (data.op) {
            case 0:
                this.bot.lastSeq = data.s
                let channel: c.AllChannels, 
                    invite: Invite, 
                    guild: Guild, 
                    message: Message, 
                    messages: Message[], 
                    role: Role, 
                    user: User|ClientUser, 
                    member: Member, 
                    emojis: Emoji[],
                    vs: VoiceState, 
                    parsedData
                switch (data.t) {
                case "READY":
                    this.bot.user = new ClientUser(data.d.user, this.bot)
                    this.bot.http = new HTTP(this.bot)
                    this.bot.sessionID = data.d.session_id
                    this.bot.emit("ready")
                    break
                case "USER_UPDATE":
                    user = data.d.id === this.bot.user.id ? new ClientUser(data.d, this.bot) : new User(data.d, this.bot)
                    if (user instanceof ClientUser) this.bot.user = user
                    this.bot.emit("user.edit", user)
                    break
                case "MESSAGE_CREATE":
                    message = new Message(data.d, this.bot)
                    this.bot.emit("msg", message)
                    if (this.bot.opts.caching.messages) this.bot.messages.set(message.id, message)
                    break
                case "MESSAGE_DELETE":
                    message = this.bot.messages.get(data.d.id)
                    this.bot.messages.delete(data.d.id)
                    this.bot.emit("msg.delete", message)
                    break
                case "MESSAGE_DELETE_BULK":
                    messages = data.d.ids.map(i => {
                        const cached = this.bot.messages.get(i)
                        this.bot.messages.delete(i)
                        return cached
                    })
                    channel = this.bot.channels.get(data.d.channel_id) as c.GuildTextable
                    guild = this.bot.guilds.get(data.d.guild_id)
                    this.bot.emit("message.delete.bulk", messages, channel, guild)
                    break
                case "MESSAGE_UPDATE":
                    const before = this.bot.messages.get(data.d.id), after = new Message(data.d, this.bot)
                    if (this.bot.opts.caching.messages) this.bot.messages.set(data.d.id, after)
                    this.bot.emit("msg.edit", before, after)
                    break
                case "MESSAGE_REACTION_REMOVE":
                case "MESSAGE_REACTION_ADD":
                    parsedData = {
                        message: this.bot.messages.get(data.d.message.id),
                        userID: data.d.user_id,
                        emoji: data.d.emoji.id ? new Emoji(data.d.emoji, this.bot) : data.d.emoji.name,
                        channel: this.bot.channels.get(data.d.channel_id),
                        guild: this.bot.guilds.get(data.d.guild_id),
                        member: data.d.member ? parsedData.guild.members.get(data.d.member.id) : undefined 
                    }
                    this.bot.emit(data.t.includes("ADD") ? "msg.react" : "msg.react.remove", parsedData)
                    break
                case "MESSAGE_REACTION_REMOVE_ALL":
                    parsedData = {
                        channel: this.bot.channels.get(data.d.channel_id),
                        guild: this.bot.guilds.get(data.d.guild_id),
                        message: this.bot.messages.get(data.d.message.id)
                    }
                    this.bot.emit("msg.react.remove.all", parsedData)
                    break
                case "MESSAGE_REACTION_REMOVE_EMOJI":
                    parsedData = {
                        channel: this.bot.channels.get(data.d.channel_id),
                        guild: this.bot.guilds.get(data.d.guild_id),
                        message: this.bot.messages.get(data.d.message.id),
                        emoji: data.d.emoji.id ? new Emoji(data.d.emoji, this.bot) : data.d.name
                    }
                    this.bot.emit("msg.react.remove.emoji", parsedData)
                    break
                case "TYPING_START":
                    parsedData = {
                        message: this.bot.messages.get(data.d.message.id),
                        userID: data.d.user_id,
                        timestamp: data.d.timestamp,
                        channel: this.bot.channels.get(data.d.channel_id),
                        guild: this.bot.guilds.get(data.d.guild_id),
                        member: parsedData.guild.members.get(data.d.user_id)
                    }
                    this.bot.emit("typing", parsedData)
                    break
                case "WEBHOOKS_UPDATE":
                    guild = this.bot.guilds.get(data.d.guild_id), channel = guild.channels.get(data.d.channel_id) as c.GuildTextable
                    this.bot.emit("webhooks.edit", channel, guild)
                    break
                case "GUILD_UPDATE":
                case "GUILD_CREATE":
                    guild = new Guild(data.d, this.bot)
                    if (this.bot.opts.requestAllMembers) this.send(JSON.stringify({ op: 8, d: { guild_id: data.d.id, query: "", limit: 0 } }))
                    this.bot.guilds.set(data.d.id, guild)
                    this.bot.emit(data.t.includes("CREATE") ? "guild.new" : "guild.edit", guild)
                    break
                case "GUILD_MEMBERS_CHUNK":
                    console.log('wuw')
                    guild = this.bot.guilds.get(data.d.guild_id)
                    data.d.members.map(d => {
                        Object.assign(d, { guild_id: data.d.guild_id })
                        guild.members.set(d.id, new Member(d, this.bot))
                    })
                    break 
                case "GUILD_DELETE":
                    guild = this.bot.guilds.get(data.d.id)
                    if (!data.d.unavailible) this.bot.guilds.delete(data.d.id)
                    this.bot.emit("guild.delete", guild)
                    break
                case "GUILD_INTEGRATIONS_UPDATE":
                    guild = this.bot.guilds.get(data.d.guild_id)
                    this.bot.emit("guild.integrations.edit", guild)
                case "GUILD_EMOJIS_UPDATE":
                    guild = this.bot.guilds.get(data.d.guild_id), emojis = data.d.emojis.map(d => new Emoji(d, this.bot))
                    this.bot.emit("guild.emojis.edit", guild, emojis)
                    break
                case "CHANNEL_UPDATE":
                case "CHANNEL_CREATE":
                    switch (data.d.type) {
                    case 0: 
                        channel = new c.TextChannel(data.d, this.bot)
                        if (this.bot.opts.caching.channels) this.bot.channels.set(data.d.id, channel)
                        this.bot.guilds.get(data.d.guild_id).channels.set(data.d.id, channel)
                        break
                    case 2:
                        channel = new c.VoiceChannel(data.d, this.bot)
                        if (this.bot.opts.caching.channels) this.bot.channels.set(data.d.id, channel)
                        this.bot.guilds.get(data.d.guild_id).channels.set(data.d.id, channel)
                        break
                    case 4:
                        channel = new c.ChannelCategory(data.d, this.bot)
                        if (this.bot.opts.caching.channels) this.bot.channels.set(data.d.id, channel)
                        this.bot.guilds.get(data.d.guild_id).channels.set(data.d.id, channel)
                        break
                    case 5:
                        channel = new c.NewsChannel(data.d, this.bot)
                        if (this.bot.opts.caching.channels) this.bot.channels.set(data.d.id, channel)
                        this.bot.guilds.get(data.d.guild_id).channels.set(data.d.id, channel)
                        break
                    case 6:
                        channel = new c.StoreChannel(data.d, this.bot)
                        if (this.bot.opts.caching.channels) this.bot.channels.set(data.d.id, channel)
                        this.bot.guilds.get(data.d.guild_id).channels.set(data.d.id, channel)
                        break
                    }
                    this.bot.emit(data.t.includes("CREATE") ? "channel.create" : "channel.edit", channel)
                    break
                case "CHANNEL_DELETE":
                    channel = this.bot.channels.get(data.d.id) as c.GuildChannels, guild = this.bot.guilds.get(data.d.guild_id)
                    this.bot.channels.delete(data.d.id)
                    if (guild) guild.channels.delete(data.d.id)
                    this.bot.emit("channel.delete", channel)
                    break
                case "CHANNEL_PINS_UPDATE":
                    channel = this.bot.channels.get(data.d.id) as c.AnyTextable, guild = this.bot.guilds.get(data.d.guild_id),
                    this.bot.emit("channel.pins.edit", new Date(data.d.last_pin_timestamp), channel, guild)
                    break
                case "GUILD_ROLE_CREATE":
                case "GUILD_ROLE_UPDATE":
                    role = new Role(data.d.role, this.bot), guild = this.bot.guilds.get(data.d.guild_id)
                    if (guild) guild.roles.set(data.d.role.id, role)
                    this.bot.emit(data.t.includes("CREATE") ? "guild.role.create" : "guild.role.edit", role, guild)
                    break
                case "GUILD_ROLE_DELETE":
                    guild = this.bot.guilds.get(data.d.guild_id), role = guild.roles.get(data.d.role_id)
                    guild.roles.delete(data.d.role_id)
                    this.bot.emit("guild.role.delete", role, guild)
                    break
                case "INVITE_CREATE":
                    invite = new Invite(data.d, this.bot), guild = this.bot.guilds.get(data.d.guild_id), channel = guild.channels.get(data.d.channel_id)
                    this.bot.emit("invite.create", invite, channel, guild)
                    break
                case "INVITE_DELETE": 
                    invite = data.d.code, guild = this.bot.guilds.get(data.d.guild_id), channel = guild.channels.get(data.d.channel_id)
                    this.bot.emit("invite.delete", invite, channel, guild)
                    break
                case "GUILD_MEMBER_ADD":
                case "GUILD_MEMBER_UPDATE":
                    guild = this.bot.guilds.get(data.d.guild_id), member = new Member(data.d, this.bot)
                    if (this.bot.opts.caching.members) guild.members.set(data.d.id, member)
                    this.bot.emit(data.t.includes("ADD") ? "guild.member" : "guild.member.edit", member, guild)
                    break
                case "GUILD_MEMBER_REMOVE":
                    guild = this.bot.guilds.get(data.d.guild_id), member = new Member(data.d, this.bot)
                    if (guild) guild.members.delete(data.d.id)
                    this.bot.emit("guild.member.leave", member, guild)
                    break
                case "GUILD_BAN_ADD":
                case "GUILD_BAN_REMOVE":
                    guild = this.bot.guilds.get(data.d.guild_id), user = new User(data.d.user, this.bot)
                    this.bot.emit(data.t.includes("ADD") ? "guild.ban" : "guild.ban.remove", user, guild)
                    break
                case "VOICE_STATE_UPDATE":
                    vs = new VoiceState(data.d, this.bot)
                    this.bot.emit("voice.state.edit", vs)
                    break
                case "VOICE_SERVER_UPDATE":
                    parsedData = {
                        guild: this.bot.guilds.get(data.d.guild_id),
                        endpoint: data.d.endpoint,
                        token: data.d.token
                    }
                    this.bot.emit("voice.server.edit", parsedData)
                    break
                default: console.log(data.t)
                }
                break
            case 9: 
                if (data.d) this.send(JSON.stringify({ op: 6, token: this.bot.token, session_id: this.bot.sessionID, seq: this.bot.lastSeq }))
                break
            case 10:
                this.send(JSON.stringify({op: 2, d: this.loginPayload}))
                this.bot.heartbeatInterval = data.d.heartbeat_interval
                setInterval(() => this.send(JSON.stringify({op: 1, d: this.bot.lastSeq})), this.bot.heartbeatInterval)
                break
            }
        })
    }
    get latency() {
        let ping: number
        this.on("pingle", (start: number) => this.emit("pongle", Math.round((start - Date.now()))))
        this.emit("pingle", Date.now())
        this.on("pongle", (e) => ping = e)
        return ping
    }
}

export default PetalsWS