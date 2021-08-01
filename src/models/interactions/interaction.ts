import Base from "../base"
import { PartialChannel } from "../channel"
import Embed from "../embed"
import { Message, MessageOptions } from "../message"
import Role from "../role"
import { Member, User } from "../user"
import { Options } from "./command"

type JSONWith<T> = { [x: string]: T }
export const ResponseTypes = {
    PONG: 1,
    SEND_MESSAGE: 4,
    DELAY_MESSAGE: 5
}
export interface InteractionResponse {
    type: keyof typeof ResponseTypes,
    data: {
        tts?: boolean,
        content?: string,
        embed?: Embed,
        allowed_mentions?: { 
            parse?: "everyone" | "roles" | "users"[], 
            users?: string[], 
            roles?: string[] 
        },
        components?: MessageOptions["components"]
        flags?: 64
    }
}
class InteractionData extends Base {
    name: string
    resolved?: {
        users?: JSONWith<User>,
        members?: JSONWith<Member>,
        roles?: JSONWith<Role>,
        channels?: JSONWith<PartialChannel>
    }
    options: { 
        name: string, 
        type: number,
        value: number,
        options: Options[]
    }[]
    constructor(data, bot) {
        super(data.id, bot)
        const { name, resolved, options } = data
        this.name = name
        this.resolved = {
            users: {},
            members: {},
            roles: {},
            channels: {}
        }
        if (resolved) {
            if (resolved.users) {
                Object.keys(resolved.users).forEach(d => {
                    const userData = resolved.users[d]
                    this.resolved.users[d] = new User(userData, this._bot)
                })
            }
            if (resolved.members) {
                Object.keys(resolved.members).forEach(d => {
                    const memberData = resolved.members[d]
                    this.resolved.members[d] = new Member(memberData, this._bot)
                })
            }
            if (resolved.roles) {
                Object.keys(resolved.roles).forEach(d => {
                    const roleData = resolved.roles[d]
                    this.resolved.roles[d] = new Role(roleData, this._bot)
                })
            }
            if (resolved.channels) {
                Object.keys(resolved.channels).forEach(d => {
                    const channelData = resolved.channels[d]
                    this.resolved.channels[d] = new PartialChannel(channelData, this._bot)
                })
            }
        }
        this.options = options
    }
}
export default class Interaction extends Base {
    applicationID: string
    type: 1 | 2
    guildID?: string
    channelID?: string
    data?: InteractionData
    member?: Member
    user?: User
    token: string
    version: 1
    constructor(d, bot) {
        super(d.id, bot)
        const { application_id, type, data, guild_id, channel_id, member, user, token, version } = d
        this.applicationID = application_id
        this.type = type
        if (data && !data.custom_id) {
            Object.assign(d, { guild_id: this.guildID })
            this.data = new InteractionData(data, this._bot)
        }
        else this.data = data
        this.guildID = guild_id
        this.channelID = channel_id
        if (member) { 
            Object.assign(member, { guild_id: this.guildID })
            this.member = new Member(member, this._bot) 
        }
        this.user = user ? new User(user ?? member.user, this._bot) : new User(member.user, this._bot)
        this.token = token
        this.version = version
    }
    get asMessage() {
        return new Message({
            content: this.data.options ? `/${this.data.name} ${this.data.options.map(d => d.value).join(" ")}` : "/"+this.data.name,
            author: this.member ?? this.user, // ???
            id: this.id,
            channel_id: this.channelID,
            type: 21,
            guild_id: this.guildID,
            attachments: [],
            embeds: [],
            flags: 0
        }, this._bot)
    }
    get guild() {
        return this._bot.guilds.get(this.guildID)
    }
    async respond(opts: InteractionResponse["data"] | string) {
        const data = typeof opts === "string" ? { content: opts } : opts
        await this._bot.http.createResponse(this.id, this.token, { type: "SEND_MESSAGE", data: data })
    }
    async think() {
        await this._bot.http.createResponse(this.id, this.token, { type: "DELAY_MESSAGE", data: {} })
    }
    async editResponse(opts: InteractionResponse["data"] | string) {
        const data = typeof opts === "string" ? { content: opts } : opts
        await this._bot.http.editOriginalResponse(this.token, data)
    }
    async deleteRepsonse() {
        await this._bot.http.deleteOriginalResponse(this.token)
    }
    async followup(opts: InteractionResponse["data"] | string) {
        const data = typeof opts === "string" ? { content: opts } : opts
        return this._bot.http.createFollowupMessage(this.token, data)
    }
}

export class ButtonInteraction extends Interaction {
    // @ts-ignore
    data: { custom_id: string, component_type: 2 }
    message: Message
    constructor(d, bot) {
        super(d, bot)
        this.message = new Message(d.message, bot)
    }
}
export class SelectInteraction extends Interaction {
    // @ts-ignore
    data: { custom_id: string, values: string[], component_type: 3 }
    message: Message
    constructor(d, bot) {
        super(d, bot)
        this.message = new Message(d, bot)
    }
}