import type { AnyTextable } from "../models/channel"
import type { Guild } from "../models/guild"
import type { Message,  MessageOptions } from "../models/message"
import type Interaction from "../models/slash/interaction"
import type { InteractionResponse } from "../models/slash/interaction"
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
    interaction?: Interaction
    constructor(message: Message, bot: CommandClient, command: cmd, prefix: string, interaction?: Interaction) {
        this.message = message
        this.bot = bot
        this.command = command
        this.invokedSubcommand = undefined
        this.args = {}
        this.prefix = prefix
        this.channel = message.channel
        this.author = message.author
        this.guild = message.guild ?? undefined
        this.interaction = interaction
    }
    async respond(opts: InteractionResponse["data"] | string) {
        if (this.interaction) return this.interaction.respond(opts)
        throw new Error("Only applicable to slash command responses. Either set your command to slashOnly or confirm that the message type is CONVERTED_INTERACTION.")
    }
    async think() {
        if (this.interaction) return this.interaction.think()
        throw new Error("Only applicable to slash command responses. Either set your command to slashOnly or confirm that the message type is CONVERTED_INTERACTION.")
    }
    async editResponse(opts: InteractionResponse["data"] | string) {
        if (this.interaction) return this.interaction.editResponse(opts)
        throw new Error("Only applicable to slash command responses. Either set your command to slashOnly or confirm that the message type is CONVERTED_INTERACTION.")
    }
    async deleteResponse() {
        if (this.interaction) return this.interaction.deleteRepsonse()
        throw new Error("Only applicable to slash command responses. Either set your command to slashOnly or confirm that the message type is CONVERTED_INTERACTION.")
    }
    async followup(opts: InteractionResponse["data"] | string) {
        if (this.interaction) return this.interaction.followup(opts)
        throw new Error("Only applicable to slash command responses. Either set your command to slashOnly or confirm that the message type is CONVERTED_INTERACTION.")
    }
    async send(opts: MessageOptions | string): Promise<Message> {
        return this.message.channel.send(opts)
    }
    async reply(opts: MessageOptions | string): Promise<Message> {
        return this.message.reply(opts)
    }
    typing(): Promise<void> {
        return this.channel.typing()
    }
}