import PetalsFetch from "./fetch"
import type RawClient from "../client"
import * as fd from "form-data"
import * as m from "mime"
import * as f from "file-type"
import Message from "../models/message"
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
import { SlashCommand, SlashCommandOptions } from "../models/slash/command"
import type PetalsFile from "../utils/file"
import type Embed from "../models/embed"
import { API_URL } from "../utils/constants"
import { Webhook } from "../models/webhook"

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

class HTTP {
    bot: RawClient
    client: PetalsFetch
    constructor(bot: RawClient) {
        const headers = {
            "User-Agent": "DiscordBot (https://discord.gg/Kzm9C3NYvq, v1)",
            "Authorization": `Bot ${bot.token}`
        }
        this.client = new PetalsFetch(API_URL, headers)
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
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    /* Docs Section: Channels
       Description: Actual Channel Stuff
    */
    async createDM(userID: string) {
        try {
            const 
                res = await this.client.post("/users/@me/channels", { body: JSON.stringify({ recipient_id: userID }) }),
                data = await res.json()
            return new channels.DMChannel(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getChannel(channelID: string) {
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async deleteChannel(channelID: string) {
        try {
            await this.client.delete(`/channels/${channelID}`)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
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
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async editChannelPermissions(channelID: string, overwriteID: string, overwrite: PermissionOverwrites) {
        try {
            await this.client.put(`/channels/${channelID}/permissions/${overwriteID}`, { 
                body: JSON.stringify(overwrite.toJSON) 
            })
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
        
    }
    async deleteChannelPermissions(channelID: string, overwriteID: string) {
        try {
            await this.client.delete(`/channels/${channelID}/permissions/${overwriteID}`)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getChannelInvites(channelID: string): Promise<Invite[]> {
        try {
            const 
                res = await this.client.get(`/channels/${channelID}/invites`),
                data = await res.json()
            return data.map(d => new Invite(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async createChannelInvite(channelID: string, body: { 
        max_age?: number,
        max_uses?: number,
        temporary?: boolean,
        unique?: boolean,
        target_user?: string
    }, reason?: string) {
        try {
            const 
                res = await this.client.post(`/channels/${channelID}/invites`, { 
                    body: JSON.stringify(body),
                    headers: reason ? { "X-Audit-Log-Reason": reason } : {}
                }),
                data = await res.json()
            return new Invite(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async followNewsChannel(channelID: string, targetChannelID: string): Promise<FollowedChannel> {
        try {
            const 
                res = await this.client.post(`/channels/${channelID}/followers`, {
                    body: JSON.stringify({ webhook_channel_id: targetChannelID })
                })
            return await res.json()
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async sendTyping(channelID: string) {
        try {
            await this.client.post(`/channels/${channelID}/typing`)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
        
    }
    async getPinnedMessages(channelID: string): Promise<Message[]> {
        try {
            const 
                res = await this.client.get(`/channels/${channelID}/pins`),
                data = await res.json()
            return data.map(d => new Message(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async addPinnedMessage(channelID: string, messageID: string) {
        try {
            await this.client.put(`/channels/${channelID}/pins/${messageID}`)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async deletePinnedMessage(channelID: string, messageID: string) {
        try {
            await this.client.delete(`/channels/${channelID}/pins/${messageID}`)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    /* Docs Section: Channels
       Description: Messages
    */
    async getMessage(channelID: string, messageID: string) {
        try {
            const 
                res = await this.client.get(`/channels/${channelID}/messages/${messageID}`), 
                data = await res.json()
            return new Message(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getMessages(channelID: string, query: { before?: string, around?: string, after?: string }, limit: number = 50): Promise<Message[]> {
        try {
            if (Object.keys(query).length > 1) throw new Error("Message fetching can only have one type of query.")
            const 
                first = query[Object.keys(query)[0]],
                res = await this.client.get(`/channels/${channelID}/messages?limit=${limit}&${Object.keys(query)[0]}=${first}`), 
                data = await res.json()
            return data.map(d => new Message(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async sendMessage(channelID: string, body: {
        content?: string,
        tts?: boolean,
        embed?: Embed,
        file?: PetalsFile,
        nonce?: string | number,
        allowed_mentions?: { 
            parse?: "everyone" | "roles" | "users"[], 
            users?: string[], 
            roles?: string[] 
        }
        message_reference?: {
            message_id: string,
            channel_id?: string,
            guild_id?: string
        }
    }, bot) {
        let form: fd
        try {
            if (body.embed) body.embed = body.embed.toJSON 
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
        catch (e) {
            bot.emit("error.rest", e)
            return
        }
    }
    async deleteMessage(channelID: string, messageID: string) {
        try {
            await this.client.delete(`/channels/${channelID}/messages/${messageID}`)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async bulkDeleteMessages(channelID: string, messageIDs: string[]) {
        try {
            await this.client.post(`/channels/${channelID}/messages/bulk-delete`, { 
                body: JSON.stringify({ messages: messageIDs }) 
            })
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async editMessage(channelID: string, messageID: string, body: {
        content?: string,
        embed?: Embed,
        flags?: any,
        allowed_mentions?: any
    }) {
        try {
            const 
                res = await this.client.patch(`/channels/${channelID}/messages/${messageID}`, {
                    body: JSON.stringify(body)
                }),
                data = await res.json()
            return new Message(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async crosspostMessage(channelID: string, messageID: string) {
        try {
            const 
                res = await this.client.post(`/channels/${channelID}/messages/${messageID}/crosspost`),
                data = await res.json()
            return new Message(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    /* Docs Section: Channels
       Description: Reactions 
    */
    async addReaction(channelID: string, messageID: string, emoji: Emoji|string) {
        let safeEmoji: string
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async removeUserReaction(channelID: string, messageID: string, emoji: Emoji|string, userID?: string) {
        let safeEmoji: string
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getReactions(channelID: string, messageID: string, emoji: Emoji|string, options?: { before?: string, after?: string, limit?: number }): Promise<User[]> {
        let safeEmoji: string
        const params = options ? "?" + Object.keys(options).map((v) => `${v}=${options[v]}`).join("&") : ""
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async deleteReactions(channelID: string, messageID: string, emoji?: Emoji|string) {
        let safeEmoji: string
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    /* Docs Section: Emoji */
    async listGuildEmojis(guildID: string): Promise<Emoji[]> {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/emojis`),
                data = await res.json()
            return data.map(d => new Emoji(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
        
    }
    async getGuildEmoji(guildID: string, emojiID: string) {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/emojis/${emojiID}`),
                data = await res.json()
            return new Emoji(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async createGuildEmoji(guildID: string, body: {
        name: string,
        image: Buffer, 
        roles?: string[]
    }) {
        const sendable: any = body, b = await f.fromBuffer(body.image)
        sendable.image = `data:${b.mime};base64,${body.image.toString("base64")}`
        if (!sendable.roles) sendable.roles = []
        try {
            const 
                res = await this.client.post(`/guilds/${guildID}/emojis`, {
                    body: JSON.stringify(sendable)
                }),
                data = await res.json()
            return new Emoji(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async editGuildEmoji(guildID: string, emojiID: string, options: { name?: string, roles?: string[] }) {
        try {
            const 
                res = await this.client.patch(`/guilds/${guildID}/emojis/${emojiID}`, {
                    body: JSON.stringify(options)
                }),
                data = await res.json()
            return new Emoji(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        } 
            
    }
    async deleteGuildEmoji(guildID: string, emojiID: string) {
        try { 
            await this.client.delete(`/guilds/${guildID}/emojis/${emojiID}`)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
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
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getGuild(guildID: string, withCounts?: boolean) {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID + withCounts ? "?with_counts=true" : ""}`), 
                data = await res.json()
            return new Guild(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getGuildPreview(guildID: string) {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/preview`), 
                data = await res.json()
            return new PartialGuild(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
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
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async deleteGuild(guildID: string) {
        try {
            await this.client.delete(`/guild/${guildID}`)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getGuildChannels(guildID: string): Promise<channels.GuildChannels[]> {
        try {
            const 
                res = await this.client.get(`/guild/${guildID}/channels`),
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
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
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
        
    }
    async editChannelPositions(guildID: string, channelID: string, position: number, reason?: string) {
        try {
            await this.client.patch(`/guilds/${guildID}/channels`, {
                body: JSON.stringify({
                    id: channelID,
                    position: position
                }),
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            })
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
        
    }
    async getGuildMember(guildID: string, userID: string) {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/members/${userID}`), 
                data = await res.json()
            return new Member(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async listGuildMembers(guildID: string, options: { limit?: number, after?: string }): Promise<Member[]> { 
        try {
            const
                params = options ? "?" + Object.keys(options).map((v) => `${v}=${options[v]}`).join("&") : "",
                res = await this.client.get(`/guilds/${guildID}/members${params}`), 
                data = await res.json()
            return data.map(d => new Member(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
        
    }
    async editGuildMember(guildID: string, userID: string, body: { 
        nick?: string, 
        roles?: Role[], 
        mute?: boolean, 
        deaf?: boolean,
        channel_id?: string
    }, reason?: string) {
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
        
    }
    async editSelfNick(guildID: string, { nick, reason }: { nick?: string, reason?: string }): Promise<string> {
        try {
            const 
                res = await this.client.patch(`/guilds/${guildID}/members/@me/nick`, {
                    body: JSON.stringify({ nick: nick ?? null }),
                    headers: reason ? { "X-Audit-Log-Reason": reason } : {}
                }),
                data = await res.text()
            return data
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
        
    }
    async addGuildRole(guildID: string, userID: string, roleID: string, reason?: string) {
        try {
            await this.client.put(`/guilds/${guildID}/members/${userID}/roles/${roleID}`, {
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            })  
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async removeGuildRole(guildID: string, userID: string, roleID: string, reason?: string) {
        try {
            await this.client.delete(`/guilds/${guildID}/members/${userID}/roles/${roleID}`, {
                headers: reason ? { "X-Audit-Log-Reason": reason } : {} 
            })
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async removeGuildMember(guildID: string, userID: string, reason?: string) {
        try {
            return this.client.delete(`/guilds/${guildID}/members/${userID}`, { 
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            })
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getGuildBans(guildID: string): Promise<GuildBan[]> {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/bans`),
                data = await res.json()
            return data.map(d => new GuildBan(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getGuildBan(guildID: string, userID: string) {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/bans/${userID}`), 
                data = await res.json()
            return new GuildBan(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async createGuildBan(guildID: string, { userID, reason, body }: { userID: string, reason?: string, body?: { delete_message_days?: number, reason?: string } }) {
        try {
            await this.client.put(`/guilds/${guildID}/bans/${userID}`, {
                body: JSON.stringify(body ?? {}),
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            })
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async removeGuildBan(guildID: string, userID: string, reason?: string) {
        try {
            await this.client.delete(`/guilds/${guildID}/bans/${userID}`, {
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            })
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getGuildRoles(guildID: string): Promise<Role[]> {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/roles`),
                data = await res.json()
            return data.map(d => new Role(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async createGuildRole(guildID: string, body: {
        name?: string,
        color?: number,
        hoist?: boolean,
        mentionable?: boolean,
        permissions?: PetalsPermissions
    }, reason?: string) {
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async editGuildRolePosition(guildID: string, roleID: string, position: number, reason?: string) {
        try {
            const 
                res = await this.client.patch(`/guilds/${guildID}/roles`, {
                    body: JSON.stringify({ id: roleID, position: position }),
                    headers: reason ? { "X-Audit-Log-Reason": reason } : {}
                }),
                data = await res.json()
            return new Role(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async editGuildRole(guildID: string, roleID: string, body: {
        name?: string,
        color?: number,
        hoist?: boolean,
        mentionable?: boolean,
        permissions?: PetalsPermissions
    }, reason?: string) {
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async deleteGuildRole(guildID: string, roleID: string, reason?: string) {
        try {
            await this.client.delete(`/guilds/${guildID}/roles/${roleID}`, { 
                headers: reason ? { "X-Audit-Log-Reason": reason } : {}
            })
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getGuildPruneCount(guildID: string, options?: { days?: number, include_roles?: string[] }): Promise<{ pruned: number }> {
        try {
            const sendable: any = { ...options }
            if (sendable.include_roles) sendable.roles = sendable.include_roles.join(",")
            const 
                params = options ? "?" + Object.keys(sendable).map((v) => `${v}=${options[v]}`).join("&") : "", 
                res = await this.client.get(`/guilds/${guildID}/prune${params}`),
                data = await res.json()
            return data
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async beginGuildPrune(guildID: string, body: { days: number, compute_prune_count: boolean, include_roles: string[] }, reason?: string): Promise<{ pruned?: number }> {
        try {
            const 
                res = await this.client.post(`/guilds/${guildID}/prune`, { 
                    body: JSON.stringify(body),
                    headers: reason ? { "X-Audit-Log-Reason": reason } : {}
                }),
                data = await res.json()
            return data
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getGuildVoiceRegion(guildID: string) {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/regions`),
                data = await res.json()
            return new VoiceRegion(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getGuidInvites(guildID: string): Promise<Invite[]> {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/invites`), 
                data = await res.json()
            return data.map(d => new Invite(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getGuidIntegrations(guildID: string): Promise<Integration[]> {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/integrations`), 
                data = await res.json()
            return data.map(d => new Integration(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getGuildWidgetSettings(guildID: string): Promise<WidgetSettings> {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/widget`),
                data = await res.json()
            return data
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async editGuildWidgetSettings(guildID: string, options: { enabled?: boolean, channel_id?: string }) {
        try {
            const 
                res = await this.client.patch(`/guilds/${guildID}/widget`, {
                    body: JSON.stringify(options)
                }),
                data = await res.json()
            return new Widget(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getGuildWidget(guildID: string) {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/widget.json`),
                data = await res.json()
            return new Widget(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
        
    }
    async getGuildVanity(guildID: string): Promise<VanityData> {
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/vanity-url`),
                data = await res.json()
            return data
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    /* Docs Section: Invite */
    async getInvite(inviteCode: string, withCounts?: boolean) {
        try {
            const 
                res = await this.client.get(`/invites/${inviteCode + withCounts ? "?with_counts=true" : ""}`),
                data = await res.json()
            return new Invite(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async deleteInvite(inviteCode: string, reason?: string) {
        try {
            const 
                res = await this.client.delete(`/invites/${inviteCode}`, { 
                    headers: reason ? { "X-Audit-Log-Reason": reason } : {}
                }),
                data = await res.json()
            return new Invite(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    /* Docs Section: User */
    async fetchCurrentUser() {
        try {
            const 
                res = await this.client.get("/users/@me"),
                data = await res.json()
            return new ClientUser(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async fetchUser(userID: string) {
        try {
            const 
                res = await this.client.get(`/users/${userID}`),
                data = await res.json()
            return new User(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async editCurrentUser(body: {
        username?: string,
        avatar?: Buffer
    }) {
        try {
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
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async leaveGuild(guildID: string) {
        await this.client.delete(`/users/@me/guilds/${guildID}`)
    }
    /* Docs Section: Voice */
    async getVoiceRegions() {
        try {
            const 
                res = await this.client.get("/voice/regions"),
                data = await res.json()
            return data.map(d => new VoiceRegion(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    /* Docs Section: Webhook TODO */
    async getChannelWebhooks(channelID: string) {
        try {
            const
                res = await this.client.get(`/channels/${channelID}/webhooks`),
                data = await res.json()
            return data.map(d => new Webhook(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getGuildWebhooks(guildID: string) {
        try {
            const
                res = await this.client.get(`/guilds/${guildID}/webhooks`),
                data = await res.json()
            return data.map(d => new Webhook(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getWebhook(webhookID: string) {
        try {
            const
                res = await this.client.get(`/webhooks/${webhookID}`),
                data = await res.json()
            return data.map(d => new Webhook(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    async getWebhookWithToken(webhookID: string, token: string) {
        try {
            const
                res = await this.client.get(`/webhooks/${webhookID}/${token}`),
                data = await res.json()
            return data.map(d => new Webhook(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error.rest", e)
            return
        }
    }
    /* Docs Section: Slash Commands TODO */
    private async createGlobalSlashCommand(body: { name: string, description: string, options?: SlashCommandOptions }) {
        body.options
        const 
            res = await this.client.post(`/applications/${this.bot.user.id}/commands`),
            data = await res.json()
        return new SlashCommand(data, this.bot)
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
export default HTTP