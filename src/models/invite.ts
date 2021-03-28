import { PartialGuild } from "./guild"
import { PartialChannel } from "./channel"
import { User } from "./user"
import type RawClient from "../client"

export default class Invite {
    code: string
    guild: PartialGuild
    channel: PartialChannel
    targeted?: User
    creator: User
    private readonly _bot: RawClient
    constructor(data, bot: RawClient) {
        this._bot = bot
        const { code, guild, channel, target_user, inviter } = data
        this.code = code
        this.guild = new PartialGuild(guild, this._bot)
        this.channel = new PartialChannel(channel, this._bot)
        this.creator = new User(inviter, this._bot)
        this.targeted = target_user ? new User(target_user, this._bot) : undefined
    }
    get link() {
        return `https://discord.gg/${this.code}`
    }
}