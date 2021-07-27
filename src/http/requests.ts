import PetalsFetch from "./fetch"
import type RawClient from "../client"
import * as fd from "form-data"
import * as m from "mime"
import * as f from "file-type"
import { Message, buttonStyles, FollowupMessage, MessageOptions, componentConvert } from "../models/message"
import PermissionOverwrites from "../models/permissionoverwrite"
import Invite from "../models/invite"
import Emoji from "../models/emoji"
import * as channels from "../models/channel"
import { ClientUser, Member, User } from "../models/user"
import AuditLogEntry from "../models/auditlogentry"
import { Guild, PartialGuild } from "../models/guild"
import Role from "../models/role"
import GuildBan from "../models/guildban"
import PetalsPermissions from "../models/permissions"
import VoiceRegion from "../models/voiceregion"
import Integration from "../models/integration"
import Widget from "../models/widget"
import Application from "../models/application"
import { ApplicationCommand, OptionTypes, SlashTemplate } from "../models/interactions/command"
import type PetalsFile from "../utils/file"
import type Embed from "../models/embed"
import { API_URL } from "../utils/constants"
import Webhook from "../models/webhook"
import { InteractionResponse, ResponseTypes } from "../models/interactions/interaction"
import CommandPermissions, { SubsetPermissions } from "../models/interactions/permissions"

export const channelTypes = {
    TEXT: 0,
    VOICE: 2,
    CATEGORY: 4,
    NEWS: 5,
    STORE: 6,
    STAGE: 13
}
interface FollowedChannel {
    channel_id: string
    webhook_id: string
}

interface WidgetSettings {
    enabled: boolean
    channel_id: string
}
interface VanityData {
    code?: string
    uses: number
}

export default class HTTP {
    private bot: RawClient
    private client: PetalsFetch
    constructor(bot: RawClient) {
        const headers = {
            "User-Agent": "DiscordBot (https://discord.gg/Kzm9C3NYvq, v1)",
            "Authorization": `Bot ${bot.token}`
        }
        this.client = new PetalsFetch(API_URL, headers, bot)
        this.bot = bot
    }
    /* Docs Section: Audit Logs */
    async getAuditLogs(guildID: string, options?: {
        user_id?: string,
        action_type?: number,
        before?: string,
        limit?: number
    }) {
        const params = options ? "?" + Object.keys(options).map((v) => `${v}=${options[v]}`).join("&") : ""
        const 
            res = await this.client.get(`/guilds/${guildID}/audit-logs${params}`), 
            data = await res.json()
        return { 
            entries: data.audit_log_entries.map(d => new AuditLogEntry(d, this.bot)),
            users: data.users.map(d => new User(d, this.bot)),
            integrations: data.integrations.map(d => new Integration(d, this.bot)),
            webhooks: data.webhooks.map(d => new Webhook(d, this.bot))
        }
    }
    /* Docs Section: Channels
       Description: Actual Channel Stuff
    */
    async createDM(userID: string) {
        const 
            res = await this.client.post("/users/@me/channels", { body: JSON.stringify({ recipient_id: userID }) }),
            data = await res.json()
        return new channels.DMChannel(data, this.bot)
    }
    async getChannel(channelID: string) {
        const 
            res = await this.client.get(`/channels/${channelID}`),
            data = await res.json()
        switch (data.type) {
        case 0: return new channels.TextChannel(data, this.bot)
        case 1: return new channels.DMChannel(data, this.bot)
        case 2: return new channels.VoiceChannel(data, this.bot)
        case 4: return new channels.ChannelCategory(data, this.bot)
        case 5: return new channels.NewsChannel(data, this.bot)
        case 6: return new channels.StoreChannel(data, this.bot)
        case 13: return new channels.StageChannel(data, this.bot)
        default: throw new TypeError("The return is a channel type that has yet to be documented. Please alert the developer.")
        }
    }
    async deleteChannel(channelID: string) {
        await this.client.delete(`/channels/${channelID}`)
    }
    async editChannel(channelID: string, body: {
        name?: string,
        type?: keyof typeof channelTypes,
        position?: number,
        topic?: string,
        nsfw?: boolean,
        rate_limit_per_user?: number,
        bitrate?: number,
        user_limit?: number
        permission_overwrites?: PermissionOverwrites[]
        parent_id?: string
    }): Promise<channels.GuildChannels> {
        const sendable: any = body
        if (sendable.type) sendable.type = channelTypes[sendable.type]
        if (sendable.permission_overwrites) sendable.permission_overwrites = sendable.permission_overwrites.map(a => a.toJSON)
        const 
            res = await this.client.patch(`/channels/${channelID}`, {
                body: JSON.stringify(sendable)
            }),
            data = await res.json()
        switch (data.type) {
        case 0: return new channels.TextChannel(data, this.bot)
        case 2: return new channels.VoiceChannel(data, this.bot)
        case 4: return new channels.ChannelCategory(data, this.bot)
        case 5: return new channels.NewsChannel(data, this.bot)
        case 6: return new channels.StoreChannel(data, this.bot)
        case 13: return new channels.StageChannel(data, this.bot)
        default: throw new TypeError("The return is a channel type that has yet to be documented. Please alert the developer.")
        }
    }
    async editChannelPermissions(channelID: string, overwriteID: string, overwrite: PermissionOverwrites) {
        await this.client.put(`/channels/${channelID}/permissions/${overwriteID}`, { 
            body: JSON.stringify(overwrite.toJSON) 
        })
    }
    async deleteChannelPermissions(channelID: string, overwriteID: string) {
        await this.client.delete(`/channels/${channelID}/permissions/${overwriteID}`)
    }
    async getChannelInvites(channelID: string): Promise<Invite[]> {
        const 
            res = await this.client.get(`/channels/${channelID}/invites`),
            data = await res.json()
        return data.map(d => new Invite(d, this.bot))
    }
    async createChannelInvite(channelID: string, body: { 
        max_age?: number,
        max_uses?: number,
        temporary?: boolean,
        unique?: boolean,
        target_user?: string
    }, reason?: string) {
        const 
            res = await this.client.post(`/channels/${channelID}/invites`, { 
                body: JSON.stringify(body),
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            }),
            data = await res.json()
        return new Invite(data, this.bot)
    }
    async followNewsChannel(channelID: string, targetChannelID: string): Promise<FollowedChannel> {
        const 
            res = await this.client.post(`/channels/${channelID}/followers`, {
                body: JSON.stringify({ webhook_channel_id: targetChannelID })
            })
        return await res.json()
    }
    async sendTyping(channelID: string) {
        await this.client.post(`/channels/${channelID}/typing`)
    }
    async getPinnedMessages(channelID: string): Promise<Message[]> {
        const 
            res = await this.client.get(`/channels/${channelID}/pins`),
            data = await res.json()
        return data.map(d => new Message(d, this.bot))
    }
    async addPinnedMessage(channelID: string, messageID: string) {
        await this.client.put(`/channels/${channelID}/pins/${messageID}`)
    }
    async deletePinnedMessage(channelID: string, messageID: string) {
        await this.client.delete(`/channels/${channelID}/pins/${messageID}`)
    }
    /* Docs Section: Channels
       Description: Messages
    */
    async getMessage(channelID: string, messageID: string) {
        const 
            res = await this.client.get(`/channels/${channelID}/messages/${messageID}`), 
            data = await res.json()
        return new Message(data, this.bot)
    }
    async getMessages(channelID: string, query: { before?: string, around?: string, after?: string }, limit: number = 50): Promise<Message[]> {
        if (Object.keys(query).length > 1) throw new Error("Message fetching can only have one type of query.")
        const 
            first = query[Object.keys(query)[0]],
            res = await this.client.get(`/channels/${channelID}/messages?limit=${limit}&${Object.keys(query)[0]}=${first}`), 
            data = await res.json()
        return data.map(d => new Message(d, this.bot))
    }
    async sendMessage(channelID: string, body: MessageOptions, bot) {
        let form: fd
        if (body.embeds) body.embeds = body.embeds.map(d => d.toJSON)
        if (body.components) {
            body.components = body.components.map((d) => {
                return { 
                    type: 1,
                    components: d.components.map((m: any) => {
                        m.type = componentConvert[m.type]
                        if (m.style) m.style = buttonStyles[m.style]
                        return m
                    })
                } as any
            })
        }
        if (body.file) {
            form = new fd()
            if (body.content) { 
                form.append("content", body.content)
                delete body.content
            }
            if (body.tts) { 
                form.append("tts", body.tts) 
                delete body.tts
            }
            if (body.nonce) {
                form.append("nonce", body.nonce)
                delete body.nonce
            }
            form.append("file", body.file.buffer, { filename: body.file.name ?? "file."+m.getExtension(await body.file.mime())})
            delete body.file
            form.append("payload_json", JSON.stringify(body), { contentType: "application/json" })
        }
        const 
            res = await this.client.post(`/channels/${channelID}/messages`, {
                body: form ?? JSON.stringify(body), 
                headers: { ...(form ? form.getHeaders() : {}), "Content-Type": form ? "multipart/form-data" : "application/json" }
            }),
            data = await res.json()
        return new Message(data, bot)
    }
    async deleteMessage(channelID: string, messageID: string) {
        await this.client.delete(`/channels/${channelID}/messages/${messageID}`)
    }
    async bulkDeleteMessages(channelID: string, messageIDs: string[]) {
        await this.client.post(`/channels/${channelID}/messages/bulk-delete`, { 
            body: JSON.stringify({ messages: messageIDs }) 
        })
    }
    async editMessage(channelID: string, messageID: string, body: MessageOptions) {
        let form: fd
        if (body.embeds) body.embeds = body.embeds.map(d => d.data)
        if (body.components) {
            body.components = body.components.map((d) => {
                return { 
                    type: 1,
                    components: d.components.map((m: any) => {
                        m.type = componentConvert[m.type]
                        if (m.style) m.style = buttonStyles[m.style]
                        return m
                    })
                } as any
            })
        }
        if (body.file) {
            form = new fd()
            if (body.content) { 
                form.append("content", body.content)
                delete body.content
            }
            if (body.tts) { 
                form.append("tts", body.tts) 
                delete body.tts
            }
            if (body.nonce) {
                form.append("nonce", body.nonce)
                delete body.nonce
            }
            form.append("file", body.file.buffer, { filename: body.file.name ?? "file."+m.getExtension(await body.file.mime())})
            delete body.file
            form.append("payload_json", JSON.stringify(body), { contentType: "application/json" })
        }
        const 
            res = await this.client.patch(`/channels/${channelID}/messages/${messageID}`, {
                body: form ?? JSON.stringify(body),
                headers: { ...(form ? form.getHeaders() : {}), "Content-Type": form ? "multipart/form-data" : "application/json" }
            }),
            data = await res.json()

        return new Message(data, this.bot)
    }
    async crosspostMessage(channelID: string, messageID: string) {
        const 
            res = await this.client.post(`/channels/${channelID}/messages/${messageID}/crosspost`),
            data = await res.json()
        return new Message(data, this.bot)
    }
    /* Docs Section: Channels
       Description: Reactions 
    */
    async addReaction(channelID: string, messageID: string, emoji: Emoji|string) {
        let safeEmoji: string
        switch (typeof emoji) {
        case "string": 
            safeEmoji = emoji
            break
        case "object": 
            safeEmoji = emoji.toSafeString
            break
        }
        safeEmoji = encodeURIComponent(safeEmoji)
        await this.client.put(`/channels/${channelID}/messages/${messageID}/reactions/${safeEmoji}/@me`)
    }
    async removeUserReaction(channelID: string, messageID: string, emoji: Emoji|string, userID?: string) {
        let safeEmoji: string
        switch (typeof emoji) {
        case "string": 
            safeEmoji = emoji
            break
        case "object": 
            safeEmoji = emoji.toSafeString
            break
        }
        safeEmoji = encodeURIComponent(safeEmoji)
        await this.client.delete(`/channels/${channelID}/messages/${messageID}/reactions/${safeEmoji}/${userID ?? "@me"}`)
    }
    async getReactions(channelID: string, messageID: string, emoji: Emoji|string, options?: { before?: string, after?: string, limit?: number }): Promise<User[]> {
        let safeEmoji: string
        const params = options ? "?" + Object.keys(options).map((v) => `${v}=${options[v]}`).join("&") : ""
        switch (typeof emoji) {
        case "string": 
            safeEmoji = emoji
            break
        case "object": 
            safeEmoji = emoji.toSafeString
            break
        }
        safeEmoji = encodeURIComponent(safeEmoji)
        const 
            res = await this.client.get(`/channels/${channelID}/messages/${messageID}/reactions/${safeEmoji}${params}`),
            data = await res.json()
        return data.map(d => new User(d, this.bot))
    }
    async deleteReactions(channelID: string, messageID: string, emoji?: Emoji|string) {
        let safeEmoji: string
        if (emoji) {
            switch (typeof emoji) {
            case "string": 
                safeEmoji = emoji
                break
            case "object": 
                safeEmoji = emoji.toSafeString
                break
            }
            safeEmoji = "/" + encodeURIComponent(safeEmoji)
        }
        await this.client.delete(`/channels/${channelID}/messages/${messageID}/reactions${safeEmoji ?? ""}`)
    }
    /* Docs Section: Emoji */
    async listGuildEmojis(guildID: string): Promise<Emoji[]> {
        const 
            res = await this.client.get(`/guilds/${guildID}/emojis`),
            data = await res.json()
        return data.map(d => new Emoji(d, this.bot))
    }
    async getGuildEmoji(guildID: string, emojiID: string) {
        const 
            res = await this.client.get(`/guilds/${guildID}/emojis/${emojiID}`),
            data = await res.json()
        return new Emoji(data, this.bot)
    }
    async createGuildEmoji(guildID: string, body: {
        name: string,
        image: Buffer, 
        roles?: string[]
    }) {
        const sendable: any = body, b = await f.fromBuffer(body.image)
        sendable.image = `data:${b.mime};base64,${body.image.toString("base64")}`
        if (!sendable.roles) sendable.roles = []
        const 
            res = await this.client.post(`/guilds/${guildID}/emojis`, {
                body: JSON.stringify(sendable)
            }),
            data = await res.json()
        return new Emoji(data, this.bot)
    }
    async editGuildEmoji(guildID: string, emojiID: string, options: { name?: string, roles?: string[] }) {
        const 
            res = await this.client.patch(`/guilds/${guildID}/emojis/${emojiID}`, {
                body: JSON.stringify(options)
            }),
            data = await res.json()
        return new Emoji(data, this.bot)
            
    }
    async deleteGuildEmoji(guildID: string, emojiID: string) {
        await this.client.delete(`/guilds/${guildID}/emojis/${emojiID}`)
    }
    /* Docs Section: Guild */
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
            type: 0|2|4|5|6|13
        },
        afk_channel_id?: string,
        afk_timeout?: number,
        system_channel_id?: string
    }) {
        const sendable: any = body
        if (sendable.roles) {
            sendable.roles = sendable.roles.map(d => {
                if (d.permissions) d.permissions = d.permissions.toString
                if (!d.color) d.color = 0
                return d
            })
        }
        if (sendable.icon) { 
            const b = await f.fromBuffer(body.icon)
            sendable.icon = `data:${b.mime};base64,${body.icon.toString("base64")}` 
        }
        const 
            res = await this.client.post("/guilds", { 
                body: JSON.stringify(sendable) 
            }),
            data = await res.json()
        return new Guild(data, this.bot)
    }
    async getGuild(guildID: string, withCounts?: boolean) {
        const 
            res = await this.client.get(`/guilds/${guildID}${withCounts ? "?with_counts=true" : ""}`), 
            data = await res.json()
        return new Guild(data, this.bot)
    }
    async getGuildPreview(guildID: string) {
        const 
            res = await this.client.get(`/guilds/${guildID}/preview`), 
            data = await res.json()
        return new PartialGuild(data, this.bot)
    }
    async editGuild(guildID: string, body: {
        name?: string,
        region?: string,
        icon?: Buffer,
        banner?: Buffer,
        splash?: Buffer,
        verification_level?: 0|1|2|3|4,
        default_message_notifications?: 0|1,
        explicit_content_filter?: 0|1|2,
        afk_channel_id?: string,
        afk_timeout?: number,
        system_channel_id?: string,
        preferred_locale?: string,
        owner_id?: string
    }, reason?: string): Promise<Guild> {
        const sendable: any = body
        if (sendable.icon) { 
            const b = await f.fromBuffer(body.icon)
            sendable.icon = `data:${b.mime};base64,${body.icon.toString("base64")}` 
        }
        if (sendable.banner) { 
            const b = await f.fromBuffer(body.banner)
            sendable.banner = `data:${b.mime};base64,${body.banner.toString("base64")}` 
        }
        if (sendable.splash) { 
            const b = await f.fromBuffer(body.splash)
            sendable.splash = `data:${b.mime};base64,${body.icon.toString("base64")}` 
        }
        const 
            res = await this.client.patch(`/guilds/${guildID}`, {
                body: JSON.stringify(sendable),
                headers: { ...(reason ? { "X-Audit-Log-Reason": reason } : {}) }
            }), 
            data = await res.json()
        return new Guild(data, this.bot)
    }
    async deleteGuild(guildID: string) {
        await this.client.delete(`/guilds/${guildID}`)
    }
    async getGuildChannels(guildID: string): Promise<channels.GuildChannels[]> {
        const 
            res = await this.client.get(`/guilds/${guildID}/channels`),
            data = await res.json()
        return data.map(d => {
            switch (d.type) {
            case 0: return new channels.TextChannel(d, this.bot)
            case 2: return new channels.VoiceChannel(d, this.bot)
            case 4: return new channels.ChannelCategory(d, this.bot)
            case 5: return new channels.NewsChannel(d, this.bot)
            case 6: return new channels.StoreChannel(d, this.bot)
            case 13: return new channels.StageChannel(data, this.bot)
            default: throw new TypeError("The return is a channel type that has yet to be documented. Please alert the developer.")
            }
        })
    }
    async createGuildChannel(guildID: string, body: {
        name: string,
        type?: 0|2|4|5|6|13,
        position?: number,
        topic?: string,
        nsfw?: boolean,
        rate_limit_per_user?: number,
        bitrate?: number,
        user_limit?: number
        permission_overwrites?: PermissionOverwrites[]
        parent_id?: string
    }): Promise<channels.GuildChannels> {
        const sendable: any = body
        const 
            res = await this.client.post(`/guilds/${guildID}/channels`, { body: JSON.stringify(sendable) }),
            data = await res.json()
        switch (data.type) {
        case 0: return new channels.TextChannel(data, this.bot)
        case 2: return new channels.VoiceChannel(data, this.bot)
        case 4: return new channels.ChannelCategory(data, this.bot)
        case 5: return new channels.NewsChannel(data, this.bot)
        case 6: return new channels.StoreChannel(data, this.bot)
        case 13: return new channels.StageChannel(data, this.bot)
        default: throw new TypeError("The return is a channel type that has yet to be documented. Please alert the developer.")
        }
        
    }
    async editChannelPositions(guildID: string, channelID: string, position: number, reason?: string) {
        await this.client.patch(`/guilds/${guildID}/channels`, {
            body: JSON.stringify({
                id: channelID,
                position: position
            }),
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
        
    }
    async getGuildMember(guildID: string, userID: string) {
        const 
            res = await this.client.get(`/guilds/${guildID}/members/${userID}`), 
            data = await res.json()
        return new Member(data, this.bot)
    }
    async listGuildMembers(guildID: string, options: { limit?: number, after?: string }): Promise<Member[]> { 
        const
            params = options ? "?" + Object.keys(options).map((v) => `${v}=${options[v]}`).join("&") : "",
            res = await this.client.get(`/guilds/${guildID}/members${params}`), 
            data = await res.json()
        return data.map(d => new Member(d, this.bot))
        
    }
    async editGuildMember(guildID: string, userID: string, body: { 
        nick?: string, 
        roles?: Role[], 
        mute?: boolean, 
        deaf?: boolean,
        channel_id?: string
    }, reason?: string) {
        const sendable: any = body
        if (sendable.roles) sendable.roles = sendable.roles.map((d: Role) =>{
            if (d.fromID !== guildID) throw new Error(`Role (${d.id}) in provided roles is not assigned to this guild.`)
            return d.id
        })
        const 
            res = await this.client.patch(`/guilds/${guildID}/members/${userID}`, {
                body: JSON.stringify(sendable),
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            }), 
            data = await res.json()
        return new Member(data, this.bot)
        
    }
    async editSelfNick(guildID: string, { nick, reason }: { nick?: string, reason?: string }): Promise<string> {
        const 
            res = await this.client.patch(`/guilds/${guildID}/members/@me/nick`, {
                body: JSON.stringify({ nick: nick ?? null }),
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            }),
            data = await res.text()
        return data
    }
    async addGuildRole(guildID: string, userID: string, roleID: string, reason?: string) {
        await this.client.put(`/guilds/${guildID}/members/${userID}/roles/${roleID}`, {
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
    }
    async removeGuildRole(guildID: string, userID: string, roleID: string, reason?: string) {
        await this.client.delete(`/guilds/${guildID}/members/${userID}/roles/${roleID}`, {
            headers: reason ? { "X-Audit-Log-Reason": reason } : {} 
        })
    }
    async removeGuildMember(guildID: string, userID: string, reason?: string) {
        return this.client.delete(`/guilds/${guildID}/members/${userID}`, { 
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
    }
    async getGuildBans(guildID: string): Promise<GuildBan[]> {
        const 
            res = await this.client.get(`/guilds/${guildID}/bans`),
            data = await res.json()
        return data.map(d => new GuildBan(d, this.bot))
    }
    async getGuildBan(guildID: string, userID: string) {
        const 
            res = await this.client.get(`/guilds/${guildID}/bans/${userID}`), 
            data = await res.json()
        return new GuildBan(data, this.bot)
    }
    async createGuildBan(guildID: string, { userID, reason, body }: { userID: string, reason?: string, body?: { delete_message_days?: number, reason?: string } }) {
        await this.client.put(`/guilds/${guildID}/bans/${userID}`, {
            body: JSON.stringify(body ?? {}),
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
    }
    async removeGuildBan(guildID: string, userID: string, reason?: string) {
        await this.client.delete(`/guilds/${guildID}/bans/${userID}`, {
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
    }
    async getGuildRoles(guildID: string): Promise<Role[]> {
        const 
            res = await this.client.get(`/guilds/${guildID}/roles`),
            data = await res.json()
        return data.map(d => new Role(d, this.bot))
    }
    async createGuildRole(guildID: string, body: {
        name?: string,
        color?: number,
        hoist?: boolean,
        mentionable?: boolean,
        permissions?: PetalsPermissions
    }, reason?: string) {
        const sendable: any = body
        if (sendable.permissions) sendable.permissions = sendable.permissions.toString
        if (!sendable.color) sendable.color = 0
        const 
            res = await this.client.post(`/guilds/${guildID}/roles`, { 
                body: JSON.stringify(sendable), 
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            }), 
            data = await res.json()
        return new Role(data, this.bot)
    }
    async editGuildRolePosition(guildID: string, roleID: string, position: number, reason?: string) {
        const 
            res = await this.client.patch(`/guilds/${guildID}/roles`, {
                body: JSON.stringify({ id: roleID, position: position }),
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            }),
            data = await res.json()
        return new Role(data, this.bot)
    }
    async editGuildRole(guildID: string, roleID: string, body: {
        name?: string,
        color?: number,
        hoist?: boolean,
        mentionable?: boolean,
        permissions?: PetalsPermissions
    }, reason?: string) {
        const sendable: any = body
        if (sendable.permissions) sendable.permissions = sendable.permissions.toString
        if (!sendable.color) sendable.color = 0
        const 
            res = await this.client.patch(`/guilds/${guildID}/roles/${roleID}`, {
                body: JSON.stringify(sendable),
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            }), 
            data = await res.json()
        return new Role(data, this.bot)
    }
    async deleteGuildRole(guildID: string, roleID: string, reason?: string) {
        await this.client.delete(`/guilds/${guildID}/roles/${roleID}`, { 
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
    }
    async getGuildPruneCount(guildID: string, options?: { days?: number, include_roles?: string[] }): Promise<{ pruned: number }> {
        const sendable: any = { ...options }
        if (sendable.include_roles) sendable.roles = sendable.include_roles.join(",")
        const 
            params = options ? "?" + Object.keys(sendable).map((v) => `${v}=${options[v]}`).join("&") : "", 
            res = await this.client.get(`/guilds/${guildID}/prune${params}`),
            data = await res.json()
        return data
    }
    async beginGuildPrune(guildID: string, body: { days: number, compute_prune_count: boolean, include_roles: string[] }, reason?: string): Promise<{ pruned?: number }> {
        const 
            res = await this.client.post(`/guilds/${guildID}/prune`, { 
                body: JSON.stringify(body),
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            }),
            data = await res.json()
        return data
    }
    async getGuildVoiceRegion(guildID: string) {
        const 
            res = await this.client.get(`/guilds/${guildID}/regions`),
            data = await res.json()
        return new VoiceRegion(data, this.bot)
    }
    async getGuidInvites(guildID: string): Promise<Invite[]> {
        const 
            res = await this.client.get(`/guilds/${guildID}/invites`), 
            data = await res.json()
        return data.map(d => new Invite(d, this.bot))
    }
    async getGuidIntegrations(guildID: string): Promise<Integration[]> {
        const 
            res = await this.client.get(`/guilds/${guildID}/integrations`), 
            data = await res.json()
        return data.map(d => new Integration(d, this.bot))
    }
    async getGuildWidgetSettings(guildID: string): Promise<WidgetSettings> {
        const 
            res = await this.client.get(`/guilds/${guildID}/widget`),
            data = await res.json()
        return data
    }
    async editGuildWidgetSettings(guildID: string, options: { enabled?: boolean, channel_id?: string }) {
        const 
            res = await this.client.patch(`/guilds/${guildID}/widget`, {
                body: JSON.stringify(options)
            }),
            data = await res.json()
        return new Widget(data, this.bot)
    }
    async getGuildWidget(guildID: string) {
        const 
            res = await this.client.get(`/guilds/${guildID}/widget.json`),
            data = await res.json()
        return new Widget(data, this.bot)
    }
    async getGuildVanity(guildID: string): Promise<VanityData> {
        const 
            res = await this.client.get(`/guilds/${guildID}/vanity-url`),
            data = await res.json()
        return data
    }
    /* Docs Section: Invite */
    async getInvite(inviteCode: string, withCounts?: boolean) {
        const 
            res = await this.client.get(`/invites/${inviteCode + withCounts ? "?with_counts=true" : ""}`),
            data = await res.json()
        return new Invite(data, this.bot)
    }
    async deleteInvite(inviteCode: string, reason?: string) {
        const 
            res = await this.client.delete(`/invites/${inviteCode}`, { 
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            }),
            data = await res.json()
        return new Invite(data, this.bot)
    }
    /* Docs Section: User */
    async fetchCurrentUser() {
        const 
            res = await this.client.get("/users/@me"),
            data = await res.json()
        return new ClientUser(data, this.bot)
    }
    async fetchUser(userID: string) {
        const 
            res = await this.client.get(`/users/${userID}`),
            data = await res.json()
        return new User(data, this.bot)
    }
    async editCurrentUser(body: {
        username?: string,
        avatar?: Buffer
    }) {
        const sendable: any = body
        if (sendable.icon) { 
            const b = await f.fromBuffer(body.avatar)
            sendable.icon = `data:${b.mime};base64,${body.avatar.toString("base64")}` 
        }
        const 
            res = await this.client.patch("/users/@me", {
                body: JSON.stringify(sendable)
            }),
            data = await res.json()
        return new ClientUser(data, this.bot)
    }
    async leaveGuild(guildID: string) {
        await this.client.delete(`/users/@me/guilds/${guildID}`)
    }
    /* Docs Section: Voice */
    async getVoiceRegions() {
        const 
            res = await this.client.get("/voice/regions"),
            data = await res.json()
        return data.map(d => new VoiceRegion(d, this.bot))
    }
    /* Docs Section: Webhook TODO */
    async getChannelWebhooks(channelID: string) {
        const
            res = await this.client.get(`/channels/${channelID}/webhooks`),
            data = await res.json()
        return data.map(d => new Webhook(d, this.bot))

    }
    async getGuildWebhooks(guildID: string) {
        const
            res = await this.client.get(`/guilds/${guildID}/webhooks`),
            data = await res.json()
        return data.map(d => new Webhook(d, this.bot))
    }
    async getWebhook(webhookID: string) {
        const
            res = await this.client.get(`/webhooks/${webhookID}`),
            data = await res.json()
        return new Webhook(data, this.bot)
    }
    async modifyWebhook(webhookID: string, body: {
        name?: string,
        avatar_url?: Buffer,
        channel_id?: string
    }) {
        const sendable: any = body
        if (body.avatar_url) { 
            const b = await f.fromBuffer(body.avatar_url)
            sendable.avatar_url = `data:${b.mime};base64,${body.avatar_url.toString("base64")}` 
        }
        const
            res = await this.client.patch(`/webhooks/${webhookID}/`, {
                body: JSON.stringify(sendable)
            }),
            data = await res.json()
        return new Webhook(data, this.bot)
    }
    async deleteWebhook(webhookID: string) {
        await this.client.delete(`/webhooks/${webhookID}`)
    }
    async deleteWebhookWithToken(webhookID: string, webhookToken: string) {
        await this.client.delete(`/webhooks/${webhookID}/${webhookToken}`)
    }
    async executeWebhook(webhookID: string, webhookToken: string, body: {
        content?: string,
        username?: string,
        wait?: boolean,
        avatar_url?: string,
        tts?: boolean,
        file?: PetalsFile,
        embeds?: Embed[],
        allowed_mentions?: { 
            parse?: "everyone" | "roles" | "users"[], 
            users?: string[], 
            roles?: string[] 
        }
    }) {
        let form: fd
        const wait = body.wait
        delete body.wait
        if (body.embeds) body.embeds = body.embeds.map(d => d.toJSON)
        if (body.file) {
            form = new fd()
            if (body.content) { 
                form.append("content", body.content)
                delete body.content
            }
            if (body.tts) { 
                form.append("tts", body.tts) 
                delete body.tts
            }
            form.append("file", body.file.buffer, { filename: body.file.name ?? "file."+m.getExtension(await body.file.mime())})
            delete body.file
            form.append("payload_json", JSON.stringify(body), { contentType: "application/json" })
        }
        await this.client.post(`/webhooks/${webhookID}/${webhookToken + wait ? "?wait=true" : ""}`, {
            body: form ?? JSON.stringify(body), 
            headers: { ...(form ? form.getHeaders() : {}), "Content-Type": form ? "multipart/form-data" : "application/json" }
        })
    }
    async editWebhookMessage(webhookID: string, webhookToken: string, messageID: string, body: {
        content?: string,
        embeds?: Embed[],
        file?: PetalsFile,
        wait?: boolean,
        allowed_mentions?: { 
            parse?: "everyone" | "roles" | "users"[], 
            users?: string[], 
            roles?: string[] 
        }
    }) {
        let form: fd
        const wait = body.wait
        delete body.wait
        if (body.embeds) body.embeds = body.embeds.map(d => d.toJSON)
        if (body.file) {
            form = new fd()
            if (body.content) { 
                form.append("content", body.content)
                delete body.content
            }
            form.append("file", body.file.buffer, { filename: body.file.name ?? "file."+m.getExtension(await body.file.mime())})
            delete body.file
            form.append("payload_json", JSON.stringify(body), { contentType: "application/json" })
        }
        const 
            res = await this.client.patch(`/webhooks/${webhookID}/${webhookToken}/messages/${messageID + wait ? "?wait=true" : ""}`, {
                body: form ?? JSON.stringify(body), 
                headers: { ...(form ? form.getHeaders() : {}), "Content-Type": form ? "multipart/form-data" : "application/json" }
            }),
            data = await res.json()
        return new Message(data, this.bot)
    }
    async deleteWebhookMessage(webhookID: string, webhookToken: string, messageID: string) {
        await this.client.delete(`/webhooks/${webhookID}/${webhookToken}/messages/${messageID}`)
    }
    /* Docs Section: Slash Commands TODO */
    async getGlobalSlashCommands(): Promise<ApplicationCommand[]> {
        const 
            res = await this.client.get(`/applications/${this.bot.user.id}/commands`),
            data = await res.json()
        return data.map(d => new ApplicationCommand(d, this.bot))
    }
    async getGlobalSlashCommand(commandID: string) {
        const
            res = await this.client.get(`/applications/${this.bot.user.id}/commands/${commandID}`),
            data = await res.json()
        return new ApplicationCommand(data, this.bot)
    }
    async createGlobalSlashCommand(body: SlashTemplate) {
        if (body.options) body.options = body.options.map(d => {
            d.type = OptionTypes[d.type] as any
            return d
        })
        const 
            res = await this.client.post(`/applications/${this.bot.user.id}/commands`, {
                body: JSON.stringify(body)
            }),
            data = await res.json()
        return new ApplicationCommand(data, this.bot)
    }
    async editGlobalSlashCommand(commandID: string, body: SlashTemplate) {
        if (body.options) body.options = body.options.map(d => {
            d.type = OptionTypes[d.type] as any
            return d
        })
        const 
            res = await this.client.patch(`/applications/${this.bot.user.id}/commands/${commandID}`, {
                body: JSON.stringify(body)
            }),
            data = await res.json()
        return new ApplicationCommand(data, this.bot)
    }
    async deleteGlobalSlashCommand(commandID: string) {
        await this.client.delete(`/applications/${this.bot.user.id}/commands/${commandID}`)
    }
    async overwriteGlobalSlashCommands(body: SlashTemplate[]) {
        body = body.map(d => {
            if (d.options) d.options = d.options.map(e => {
                e.type = OptionTypes[e.type] as any
                return e
            })
            return d
        })
        const 
            res = await this.client.put(`/applications/${this.bot.user.id}/commands`, {
                body: JSON.stringify(body)
            }),
            data = await res.json()
        return data.map(d => new ApplicationCommand(d, this.bot))
    }
    async getGuildSlashCommands(guildID: string): Promise<ApplicationCommand[]> {
        const 
            res = await this.client.get(`/applications/${this.bot.user.id}/guilds/${guildID}/commands`),
            data = await res.json()
        return data.map(d => new ApplicationCommand(d, this.bot))
    }
    async getGuildSlashCommand(guildID: string, commandID: string) {
        const
            res = await this.client.get(`/applications/${this.bot.user.id}/guilds/${guildID}/commands/${commandID}`),
            data = await res.json()
        return new ApplicationCommand(data, this.bot)
    }
    async createGuildSlashCommand(guildID: string, body: SlashTemplate) {
        if (body.options) body.options = body.options.map(d => {
            d.type = OptionTypes[d.type] as any
            return d
        })
        const 
            res = await this.client.post(`/applications/${this.bot.user.id}/guilds/${guildID}/commands`, {
                body: JSON.stringify(body)
            }),
            data = await res.json()
        return new ApplicationCommand(data, this.bot)
    }
    async editGuildSlashCommand(guildID: string, commandID: string, body: SlashTemplate) {
        if (body.options) body.options = body.options.map(d => {
            d.type = OptionTypes[d.type] as any
            return d
        })
        const 
            res = await this.client.patch(`/applications/${this.bot.user.id}/guilds/${guildID}/commands/${commandID}`, {
                body: JSON.stringify(body)
            }),
            data = await res.json()
        return new ApplicationCommand(data, this.bot)
    }
    async deleteGuildSlashCommand(guildID: string, commandID: string) {
        await this.client.delete(`/applications/${this.bot.user.id}/guilds/${guildID}/commands/${commandID}`)
    }
    async overwriteGuildSlashCommands(guildID: string, body: SlashTemplate[]) {
        body = body.map(d => {
            if (d.options) d.options = d.options.map(e => {
                e.type = OptionTypes[e.type] as any
                return e
            })
            return d
        })
        const 
            res = await this.client.put(`/applications/${this.bot.user.id}/guilds/${guildID}/commands`, {
                body: JSON.stringify(body)
            }),
            data = await res.json()
        return data.map(d => new ApplicationCommand(d, this.bot))
    }
    async createResponse(interactionID: string, interactionToken: string, body: InteractionResponse) {
        const sendable: any = body
        sendable.type = ResponseTypes[body.type]
        if (body.data.embed) sendable.data.embed = body.data.embed.toJSON
        await this.client.post(`/interactions/${interactionID}/${interactionToken}/callback`, {
            body: JSON.stringify(sendable)
        })
    }
    async editOriginalResponse(interactionToken: string, body: InteractionResponse["data"]) {
        if (body.embed) body.embed = body.embed.toJSON
        const
            res = await this.client.patch(`/webhooks/${this.bot.user.id}/${interactionToken}/messages/@original`, {
                body: JSON.stringify(body)
            }),
            data = await res.json()
        return data
    }
    async deleteOriginalResponse(interactionToken: string) {
        await this.client.delete(`/webhooks/${this.bot.user.id}/${interactionToken}/messages/@original`) 
    }
    async createFollowupMessage(interactionToken: string, body: {
        content?: string,
        username?: string,
        avatar_url?: string,
        tts?: boolean,
        file?: PetalsFile,
        embeds?: Embed[],
        flags?: 64,
        allowed_mentions?: { 
            parse?: "everyone" | "roles" | "users"[], 
            users?: string[], 
            roles?: string[] 
        }
    }) {
        let form: fd
        if (body.embeds) body.embeds = body.embeds.map(d => d.toJSON)
        if (body.file) {
            form = new fd()
            if (body.content) { 
                form.append("content", body.content)
                delete body.content
            }
            if (body.tts) { 
                form.append("tts", body.tts) 
                delete body.tts
            }
            form.append("file", body.file.buffer, { filename: body.file.name ?? "file."+m.getExtension(await body.file.mime())})
            delete body.file
            form.append("payload_json", JSON.stringify(body), { contentType: "application/json" })
        }
        const 
            res = await this.client.post(`/webhooks/${this.bot.user.id}/${interactionToken}`, {
                body: form ?? JSON.stringify(body), 
                headers: { ...(form ? form.getHeaders() : {}), "Content-Type": form ? "multipart/form-data" : "application/json" }
            }),
            data = await res.json()
        return new FollowupMessage(data, this.bot)
    }
    async editFollowupMessage(interactionToken: string, messageID: string, body: {
        content?: string,
        embeds?: Embed[],
        allowed_mentions?: { 
            parse?: "everyone" | "roles" | "users"[], 
            users?: string[], 
            roles?: string[] 
        }
    }) {
        if (body.embeds) body.embeds = body.embeds.map(d => d.toJSON)
        const
            res = await this.client.patch(`/webhooks/${this.bot.user.id}/${interactionToken}/messages/${messageID}`, {
                body: JSON.stringify(body)
            }),
            data = await res.json()
        return new FollowupMessage(data, this.bot)
    }
    async deleteFollowupMessage(interactionToken: string, messageID: string) {
        await this.client.delete(`/webhooks/${this.bot.user.id}/${interactionToken}/messages/${messageID}`)
    }
    async getAllGuildCommandPermissions(guildID: string): Promise<CommandPermissions[]> {
        const 
            res = await this.client.get(`/applications/${this.bot.user.id}/guilds/${guildID}/commands/permissions`),
            data = await res.json()
        return data.map(d => new CommandPermissions(d, this.bot))
    }
    async editGuildCommandPermissions(guildID: string, commandID: string, permissions: SubsetPermissions[]) {
        await this.client.put(`/applications/${this.bot.user.id}/guilds/${guildID}/commands/${commandID}/permissions`, {
            body: JSON.stringify(permissions)
        })
    }
    async massEditGuildSlashCommandPermissions(guildID: string, permissions: { id: string, permissons: SubsetPermissions[] }[]) {
        await this.client.put(`/applications/${this.bot.user.id}/guilds/${guildID}/commands/permissions`, {
            body: JSON.stringify(permissions)
        })
    }
    /* Docs Section: Misc */
    async getAppInfo() {
        const 
            res = await this.client.get("/oauth2/applications/@me"),
            data = await res.json()
        return new Application(data, this.bot)
    }
    async getBotGateway() {
        const res = await this.client.get("/gateway/bot")
        return await res.json()
    }
}
/* export class WebhookHTTP {
    private client: WebhookFetch
    constructor() {
        this.client = new WebhookFetch()
    }
    async getWebhook(webhookID: string, webhookToken: string) {
        const
            res = await this.client.get(`/${webhookID}/${webhookToken}`),
            data = await res.json()
        return new WebhookFromToken(data.id, data.token)
    }
    async modifyWebhook(webhookID: string, webhookToken: string, body: {
        name?: string,
        avatar_url?: Buffer
    }) {
        const sendable: any = body
        if (body.avatar_url) { 
            const b = await f.fromBuffer(body.avatar_url)
            sendable.avatar_url = `data:${b.mime};base64,${body.avatar_url.toString("base64")}` 
        }
        const
            res = await this.client.patch(`/${webhookID}/${webhookToken}`, {
                body: JSON.stringify(sendable)
            }),
            data = await res.json()
        return new WebhookFromToken(data.id, data.token)
    }
    async deleteWebhook(webhookID: string, webhookToken: string) {
        await this.client.delete(`/${webhookID}/${webhookToken}`)
    }
    async executeWebhook(webhookID: string, webhookToken: string, body: {
        content?: string,
        username?: string,
        wait?: boolean,
        avatar_url?: string,
        tts?: boolean,
        file?: PetalsFile,
        embeds?: Embed[],
        allowed_mentions?: { 
            parse?: "everyone" | "roles" | "users"[], 
            users?: string[], 
            roles?: string[] 
        }
    }) {
        let form: fd
        const wait = body.wait
        delete body.wait
        if (body.embeds) body.embeds = body.embeds.map(d => d.toJSON)
        if (body.file) {
            form = new fd()
            if (body.content) { 
                form.append("content", body.content)
                delete body.content
            }
            if (body.tts) { 
                form.append("tts", body.tts) 
                delete body.tts
            }
            form.append("file", body.file.buffer, { filename: body.file.name ?? "file."+m.getExtension(await body.file.mime())})
            delete body.file
            form.append("payload_json", JSON.stringify(body), { contentType: "application/json" })
        }
        await this.client.post(`/${webhookID}/${webhookToken}${wait ? "?wait=true" : ""}`, {
            body: form ?? JSON.stringify(body), 
            headers: { ...(form ? form.getHeaders() : {}), "Content-Type": form ? "multipart/form-data" : "application/json" }
        })
    }
    async editWebhookMessage(webhookID: string, webhookToken: string, messageID: string, body: {
        content?: string,
        embeds?: Embed[],
        file?: PetalsFile,
        wait?: boolean,
        allowed_mentions?: { 
            parse?: "everyone" | "roles" | "users"[], 
            users?: string[], 
            roles?: string[] 
        }
    }) {
        let form: fd
        const wait = body.wait
        delete body.wait
        if (body.embeds) body.embeds = body.embeds.map(d => d.toJSON)
        if (body.file) {
            form = new fd()
            if (body.content) { 
                form.append("content", body.content)
                delete body.content
            }
            form.append("file", body.file.buffer, { filename: body.file.name ?? "file."+m.getExtension(await body.file.mime()) })
            delete body.file
            form.append("payload_json", JSON.stringify(body), { contentType: "application/json" })
        }
        const 
            res = await this.client.patch(`/${webhookID}/${webhookToken}/messages/${messageID}${wait ? "?wait=true" : ""}`, {
                body: form ?? JSON.stringify(body), 
                headers: { ...(form ? form.getHeaders() : {}), "Content-Type": form ? "multipart/form-data" : "application/json" }
            }),
            data = await res.json()
        return data.id as string
    }
    async deleteWebhookMessage(webhookID: string, webhookToken: string, messageID: string) {
        await this.client.delete(`/${webhookID}/${webhookToken}/messages/${messageID}`)
    }
    
} */