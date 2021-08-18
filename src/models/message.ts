import Base from "./base"
import { Guild } from "./guild"
import Role from "./role"
import { Member, User } from "./user"
import * as c from "./channel"
import type RawClient from "../client"
import type PetalsFile from "../utils/file"
import Embed from "./embed"
import Emoji, { EmojiPartial } from "./emoji"
import FlagHandler from "../utils/flagcalc"

export const buttonStyles =  {
    BLURPLE: 1,
    GREY: 2,
    GREEN: 3,
    RED: 4,
    URL: 5
}

const messageFlags = {
    CROSSPOSTED: 1 << 0,
    IS_CROSSPOST: 1 << 1,
    SUPPRESS_EMBEDS: 1 << 2,
    SOURCE_MESSAGE_DELETED: 1 << 3,
    URGENT: 1 << 4
}
class Attachment {
    fileName: string
    proxyURL: string
    fileURL: string
    fileSize: number
    constructor(data) {
        const { filename, proxy_url, url, size } = data
        this.fileName = filename
        this.proxyURL = proxy_url
        this.fileURL = url
        this.fileSize = size
    }
}

export const componentConvert = {
    BUTTON: 2,
    SELECT: 3
}

/*interface ComponentTypes {
    BUTTONS: {
        url?: string,
        style: keyof typeof buttonStyles,
        custom_id?: string,
        label: string,
        disabled?: boolean,
        emoji?: EmojiPartial
    }[],
    SELECT: {
        custom_id: string,
        options: {
            label: string,
            value: string,
            description?: string,
            emoji?: EmojiPartial
        }[],
        placeholder?: string,
        min_values?: number,
        max_values?: number,
        disabled?: boolean
    }
}*/
export interface MessageOptions {
        content?: string,
        tts?: boolean,
        embeds?: Embed[],
        file?: PetalsFile,
        nonce?: string | number,
        components?: {
            components: ({
                type: "BUTTON",
                url?: string,
                style: keyof typeof buttonStyles,
                custom_id?: string,
                label: string,
                disabled?: boolean,
                emoji?: EmojiPartial
            } |
            {
                type: "SELECT",
                custom_id: string,
                options: {
                    label: string,
                    value: string,
                    description?: string,
                    emoji?: EmojiPartial
                }[],
                placeholder?: string,
                min_values?: number,
                max_values?: number,
                disabled?: boolean
            })[]

        }[]
        allowed_mentions?: { 
            parse?: "everyone" | "roles" | "users"[], 
            users?: string[], 
            roles?: string[] 
        }
}

interface EditOptions extends MessageOptions {
    flags?: 4
}
abstract class BaseMessage extends Base {
    referenceMessage?: Message
    pinned: boolean
    mentions: string[]
    roleMentions: Role[]
    embeds: Embed[]
    flags: FlagHandler
    content?: string
    author?: Member | User
    attachments: Attachment[]
    guild?: Guild
    channel: c.AnyTextable
    referencedMessage?: Message
    editedTimestamp?: Date
    type: string
    webhookID?: string
    channelID: string
    constructor(data, bot: RawClient, mock?: boolean) {
        super(data.id, bot)
        const {
            referenced_message,
            edited_timestamp,
            type,
            content,
            channel_id,
            attachments,
            embeds,
            webhook_id,
            guild_id,
            flags
        } = data
        const author = mock ? data.author : guild_id ? { ...data.member, user: data.author, guild_id: guild_id } : data.author
        this.guild = this._bot.guilds.get(guild_id)
        this.channelID = channel_id
        this.content = content
        this.webhookID = webhook_id
        this.attachments = attachments.map(a => new Attachment(a))
        this.embeds = embeds.map(d => new Embed(d))
        if (this.guild) {
            this.author = data.author instanceof Member ? data.author : this.guild.members.get(author.user.id) ?? author.user.discriminator !== "0000" ? new Member(author, this._bot) : new User(author.user, this._bot)
            this.channel = this.guild.channels.get(channel_id) as c.GuildTextable
            if (!this.channel) this._bot.fetchChannel(channel_id).then(d => this.channel = d as c.GuildTextable)
        }
        else {
            this.author = data.author instanceof User ? data.author : this._bot.users.get(author.id) ?? new User(author, this._bot)
            this.channel = this._bot.channels.get(channel_id) as c.AnyTextable
            if (!this.channel) {
                const newChannel = new c.DMChannel({ id: channel_id, recipients: [data.author] }, this._bot)
                this._bot.channels.set(this.author.id, newChannel)
                this.channel = newChannel
            }
        }
        this.flags = new FlagHandler(flags, messageFlags)
        this.editedTimestamp = edited_timestamp ? new Date(edited_timestamp) : undefined
        this.referenceMessage = referenced_message ? new Message(referenced_message, this._bot) : undefined
        switch (type) {
        case 0:
            this.type = "DEFAULT"
            break
        case 1:
            this.type = "RECIPIENT_ADD"
            break
        case 2:
            this.type = "RECIPIENT_REMOVE"
            break
        case 3:
            this.type = "CALL"
            break
        case 4:
            this.type = "CHANNEL_NAME_CHANGE"
            break
        case 5:
            this.type = "CHANNEL_ICON_CHANGE"
            break
        case 6:
            this.type = "CHANNEL_PINNED_MESSAGE"
            break
        case 7:
            this.type = "GUILD_MEMBER_JOIN"
            break
        case 8:
            this.type = "USER_PREMIUM_GUILD_SUBSCRIPTION"
            break
        case 9:
            this.type = "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1"
            break
        case 10:
            this.type = "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2"
            break
        case 11:
            this.type = "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3"
            break
        case 12:
            this.type = "CHANNEL_FOLLOW_ADD"
            break
        case 14:
            this.type = "GUILD_DISCOVERY_DISQUALIFIED"
            break
        case 15:
            this.type = "GUILD_DISCOVERY_REQUALIFIED"
            break
        case 19: 
            this.type = "REPLY"
            break
        case 20:
            this.type = "APPLICATION_COMMAND"
            break
        case 21: 
            this.type = "THREAD_STARTER_MESSAGE"
            break
        case 22:
            this.type = "GUILD_INVITE_REMINDER"
            break
        case -1:
            this.type = "CONVERTED_INTERACTION"
        }
    }
    async pin() {
        await this._bot.http.addPinnedMessage(this.channelID, this.id)
    }
    async unpin() {
        await this._bot.http.deletePinnedMessage(this.channelID, this.id)
    }
    async react(emoji: Emoji|string) {
        await this._bot.http.addReaction(this.channelID, this.id, emoji)
    }
    async removeReaction(emoji: Emoji|string, userID?: string) {
        if (userID) {
            await this._bot.http.removeUserReaction(this.channelID, this.id, emoji, userID)
            return
        }
        await this._bot.http.removeUserReaction(this.channelID, this.id, emoji)
    }
    async removeAllReactions(emoji?: Emoji|string) {
        if (emoji) {
            await this._bot.http.deleteReactions(this.channelID, this.id, emoji)
            return
        }
        await this._bot.http.deleteReactions(this.channelID, this.id)
    }
}
export class Message extends BaseMessage {
    async edit(opts: EditOptions | string) {
        if (this.author.id !== this._bot.user.id) throw new TypeError("Cannot edit message as it was not sent by client.")
        const data = typeof opts === "string" ? { content: opts } : { ...opts }
        return this._bot.http.editMessage(this.channelID, this.id, data)
    }
    async reply(opts: MessageOptions | string) {
        const data: any = typeof opts === "string" ? { content: opts } : { ...opts }
        return this._bot.http.sendMessage(this.channelID, {
            ...data,
            message_reference: {
                message_id: this.id,
                ...(this.guild ? { guild_id: this.guild.id } : {})
            }
        }, this._bot)
    }
    async delete() {
        await this._bot.http.deleteMessage(this.channel.id, this.id)
    }
}
export class FollowupMessage extends BaseMessage {
    token: string
    constructor(data, bot) {
        super(data, bot)
        this.token = data.token
    }
    async edit(opts: EditOptions | string) {
        const data = typeof opts === "string" ? { content: opts } : { ...opts }
        return this._bot.http.editFollowupMessage(this.token, this.id, data)
    }
    async delete() {
        await this._bot.http.deleteFollowupMessage(this.token, this.id)
    }
}