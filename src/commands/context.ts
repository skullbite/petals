import type { AnyTextable, GuildChannels } from "../models/channel"
import type { Guild } from "../models/guild"
import Message, { MessageOptions } from "../models/message"
import type Role from "../models/role"
import type { Member, User } from "../models/user"
import type { cmd, argumentTypes } from "./command"
import type CommandClient from "./commandclient"

export default class CommandContext {
    message: Message
    bot: CommandClient
    command: any
    invokedSubcommand?: any
    args: { [x: string]: argumentTypes }
    prefix: string
    author: User | Member
    channel: AnyTextable
    guild?: Guild
    constructor(message: Message, bot: CommandClient, command: cmd, prefix: string) {
        this.message = message
        this.bot = bot
        this.command = command
        this.invokedSubcommand = undefined
        this.args = {}
        this.prefix = prefix
        this.channel = message.channel
        this.author = message.author
        this.guild = message.guild ?? undefined
    }
    send(opts: MessageOptions): Promise<Message> {
        return this.message.channel.send(opts)
    }
    reply(opts: MessageOptions): Promise<Message> {
        return this.message.reply(opts)
    }
    typing(): Promise<void> {
        return this.channel.typing()
    }
}