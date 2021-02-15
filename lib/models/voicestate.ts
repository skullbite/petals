import { VoiceChannel } from "./channel"
import type { Guild } from "./guild"
import { Member, User } from "./user"

class VoiceState {
    guild: Guild
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
        const { guild_id, channel_id, user_id, member, session_id, deaf, mute, self_deaf, self_mute, self_stream, self_video, suppress } = data
        this.guild = bot.guilds.get(guild_id)
        this.channel = this.guild.channels.get(channel_id) as VoiceChannel
        this.member = this.guild.members.get(user_id) ?? new Member(member, bot)
        this.sessionID = session_id
        this.deaf = deaf
        this.mute = mute
        this.selfDeaf = self_deaf
        this.selfMute = self_mute
        this.selfStream = self_stream
        this.selfVideo = self_video
        this.suppress = suppress
    }
}
export default VoiceState