import RawClient from "../client"
import { VoiceChannel } from "./channel"
import { Member } from "./user"

export default class VoiceState {
    _bot: RawClient
    fromID: string
    channel: VoiceChannel
    member: Member
    sessionID: string
    deaf: boolean
    mute: boolean
    selfDeaf: boolean
    selfMute: boolean
    selfStream: boolean
    selfVideo: boolean
    suppress: boolean
    constructor(data, bot) {
        this._bot = bot
        const { guild_id, channel_id, user_id, member, session_id, deaf, mute, self_deaf, self_mute, self_stream, self_video, suppress } = data
        this.fromID = guild_id
        this.channel = this.from.channels.get(channel_id) as VoiceChannel
        this.member = this.from.members.get(user_id) ?? new Member(member, bot)
        this.sessionID = session_id
        this.deaf = deaf
        this.mute = mute
        this.selfDeaf = self_deaf
        this.selfMute = self_mute
        this.selfStream = self_stream
        this.selfVideo = self_video
        this.suppress = suppress
    }
    get from() {
        return this._bot.guilds.get(this.fromID)
    }
}

export class MinimalVoiceState {
    #bot: RawClient
    fromID: string
    channelID: string
    sessionID: string
    deaf: boolean
    mute: boolean
    selfDeaf: boolean
    selfMute: boolean
    selfStream: boolean
    selfVideo: boolean
    suppress: boolean
    constructor(data, bot) {
        const { guild_id, channel_id, session_id, deaf, mute, self_deaf, self_mute, self_stream, self_video, suppress } = data
        this.#bot = bot
        this.fromID = guild_id
        this.channelID = channel_id
        this.sessionID = session_id
        this.deaf = deaf
        this.mute = mute
        this.selfDeaf = self_deaf
        this.selfMute = self_mute
        this.selfStream = self_stream
        this.selfVideo = self_video
        this.suppress = suppress
    }
    get channel() {
        return this.#bot.guilds.get(this.fromID).channels.get(this.channelID)
    }
}

export class ClientVoiceState extends MinimalVoiceState {
    token: string
    endpoint: string
    constructor(data, bot: RawClient) {
        super(data, bot)
        bot.once("voice.server.edit", (d) => {
            this.token = d.token
            this.endpoint = d.endpoint
        })
    }
}