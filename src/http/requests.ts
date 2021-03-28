import PetalsFetch from "./fetch"
import type RawClient from "../client"
import * as fd from "form-data"
// Model Imports
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
// Type Imports
import type PetalsFile from "../utils/file"
import type Embed from "../models/embed"
import Application from "../models/application"
import { SlashCommand, SlashCommandOptions } from "../models/slash/command"

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

const API_URL = "https://discord.com/api/v8"

class HTTP {
    bot: RawClient
    client: PetalsFetch
    headers
    constructor(bot: RawClient) {
        const headers = {
            "User-Agent": "DiscordBot (https://discord.gg/Kzm9C3NYvq, v1)",
            "Authorization": `Bot ${bot.token}`
        }
        this.client = new PetalsFetch(API_URL, headers)
        this.headers = headers
    }
    /* Docs Section: Audit Logs */
    async getAuditLogs(guildID: string, options?: {
        user_id?: string,
        action_type?: number,
        before?: string,
        limit?: number
    }): Promise<AuditLogEntry[]> {
        const params = options ? "?" + Object.keys(options).map((v) => `${v}=${options[v]}`).join("&") : ""
        try {
            const 
                res = await this.client.get(`/guilds/${guildID}/audit-logs${params}`), 
                data = await res.json()
            return data.map(d => new AuditLogEntry(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
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
            default: throw new TypeError("wtf is this a new channel type")
            }
        }
        catch (e) {
            this.bot.emit("error", e)
            return
        }
    }
    async deleteChannel(channelID: string) {
        try {
            await this.client.delete(`/channels/${channelID}`)
        }
        catch (e) {
            this.bot.emit("error", e)
            return
        }
    }
    async editChannel(channelID: string, body: {
        name?: string,
        type?: 0|2|4|5|6,
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
        if (sendable.permission_overwrites) sendable.permission_overwrites = sendable.permission_overwrites.map(a => a.toJSON)
        try {
            const 
                res = await this.client.patch(`/channels/${channelID}`, {
                    body: JSON.stringify(sendable),
                    headers: this.headers
                }),
                data = await res.json()
            switch (data.type) {
            case 0: return new channels.TextChannel(data, this.bot)
            case 2: return new channels.VoiceChannel(data, this.bot)
            case 4: return new channels.ChannelCategory(data, this.bot)
            case 5: return new channels.NewsChannel(data, this.bot)
            case 6: return new channels.StoreChannel(data, this.bot)
            default: throw new TypeError("The return is a channel type that has yet to be documented. Please alert the developer.")
            }
        }
        catch (e) {
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
            return
        }
        
    }
    async deleteChannelPermissions(channelID: string, overwriteID: string) {
        try {
            await this.client.delete(`/channels/${channelID}/permissions/${overwriteID}`)
        }
        catch (e) {
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
            return
        }
    }
    async sendTyping(channelID: string) {
        try {
            await this.client.post(`/channels/${channelID}/typing`)
        }
        catch (e) {
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
            return
        }
    }
    async addPinnedMessage(channelID: string, messageID: string) {
        try {
            await this.client.put(`/channels/${channelID}/pins/${messageID}`)
        }
        catch (e) {
            this.bot.emit("error", e)
            return
        }
    }
    async deletePinnedMessage(channelID: string, messageID: string) {
        try {
            await this.client.delete(`/channels/${channelID}/pins/${messageID}`)
        }
        catch (e) {
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
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
                form.append("file", body.file.buffer, { filename: body.file.name })
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
            bot.emit("error", e)
            return
        }
    }
    async deleteMessage(channelID: string, messageID: string) {
        try {
            await this.client.delete(`/channels/${channelID}/messages/${messageID}`)
        }
        catch (e) {
            this.bot.emit("error", e)
            return
        }
    }
    async bulkDeleteMessages(channelID: string, messageIDs: string[]) {
        return this.client.post(`/channels/${channelID}/messages/bulk-delete`, { 
            body: JSON.stringify({ messages: messageIDs }) 
        })
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
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
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
            await this.client.delete(`/channels/${channelID}/messages/${messageID}${safeEmoji ?? ""}`)
        }
        catch (e) {
            this.bot.emit("error", e)
            return
        }
    }
    /* Docs Section: Emoji */
    async listGuildEmojis(guildID: string): Promise<Emoji[]> {
        try {
            const 
                res = await this.client.get(`/guild/${guildID}/emojis`),
                data = await res.json()
            return data.map(d => new Emoji(d, this.bot))
        }
        catch (e) {
            this.bot.emit("error", e)
            return
        }
        
    }
    async getGuildEmoji(guildID: string, emojiID: string) {
        let data
        try {
            const res = await this.client.get(`/guilds/${guildID}/emojis/${emojiID}`)
            data = await res.json()
            return new Emoji(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error", e)
            return
        }
    }
    async createGuildEmoji(guildID: string, body: {
        name: string,
        image: PetalsFile, 
        roles?: string[]
    }) {
        const sendable: any = body
        sendable.image = await body.image.stringify()
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
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
            return
        } 
            
    }
    async deleteGuildEmoji(guildID: string, emojiID: string) {
        try { 
            await this.client.delete(`/guilds/${guildID}/emojis/${emojiID}`)
        }
        catch (e) {
            this.bot.emit("error", e)
            return
        }
    }
    /* Docs Section: Guild */
    async createGuild(body: {
        name: string,
        region?: string,
        icon?: PetalsFile,
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
            type: 0|2|4|5|6
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
            if (sendable.icon) sendable.icon = await sendable.icon.stringify()
            const 
                res = await this.client.post("/guilds", { 
                    body: JSON.stringify(sendable) 
                }),
                data = await res.json()
            return new Guild(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
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
            this.bot.emit("error", e)
            return
        }
    }
    async editGuild(guildID: string, body: {
        name?: string,
        region?: string,
        icon?: PetalsFile,
        banner?: PetalsFile,
        splash?: PetalsFile,
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
            if (sendable.icon) sendable.icon = await sendable.icon.stringify()
            if (sendable.banner) sendable.banner = await sendable.banner.stringify()
            if (sendable.splash) sendable.splash = await sendable.splash.stringify()
            const 
                res = await this.client.patch(`/guilds/${guildID}`, {
                    body: JSON.stringify(sendable),
                    headers: { ...(reason ? { "X-Audit-Log-Reason": reason } : {}) }
                }), 
                data = await res.json()
            return new Guild(data, this.bot)
        }
        catch (e) {
            this.bot.emit("error", e)
            return
        }
    }
    async deleteGuild(guildID: string) {
        try {
            await this.client.delete(`/guild/${guildID}`)
        }
        catch (e) {
            this.bot.emit("error", e)
            return
        }
    }
    async getGuildChannels(guildID: string): Promise<channels.GuildChannels> {
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
                default: throw new TypeError("wtf is this a new channel type")
                }
            })
        }
        catch (e) {
            this.bot.emit("error", e)
            return
        }
    }
    async createGuildChannel(guildID: string, body: {
        name: string,
        type?: 0|2|4|5|6,
        position?: number,
        topic?: string,
        nsfw?: boolean,
        rate_limit_per_user?: number,
        bitrate?: number,
        user_limit?: number
        permission_overwrites?: PermissionOverwrites[]
        parent_id?: string
    }): Promise<channels.GuildChannels> {
        let data, sendable: any = body
        const res = await this.client.post(`/guilds/${guildID}/channels`, { body: JSON.stringify(sendable) })
        
        data = await res.json()
        switch (data.type) {
        case 0: return new channels.TextChannel(data, this.bot)
        case 2: return new channels.VoiceChannel(data, this.bot)
        case 4: return new channels.ChannelCategory(data, this.bot)
        case 5: return new channels.NewsChannel(data, this.bot)
        case 6: return new channels.StoreChannel(data, this.bot)
        default: throw new TypeError("wtf is this a new channel type")
        }
    }
    async editChannelPositions(guildID: string, channelID: string, position: number, reason?: string) {
        
        return this.client.patch(`/guilds/${guildID}/channels`, {
            body: JSON.stringify({
                id: channelID,
                position: position
            }),
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
    }
    async getGuildMember(guildID: string, userID: string) {
        
        let data
        const res = await this.client.get(`/guilds/${guildID}/members/${userID}`)
        
        data = await res.json()
        return new Member(data, this.bot)
    }
    async listGuildMembers(guildID: string, options: { limit?: number, after?: string }): Promise<Member[]> {
        
        let data, params: string
        params = options ? "?" + Object.keys(options).map((v) => `${v}=${options[v]}`).join("&") : ""
        const res = await this.client.get(`/guilds/${guildID}/members${params}`)
        
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
        
        let data, sendable: any = body
        if (sendable.roles) sendable.roles = sendable.roles.map(d =>{
            if (d.guildID !== guildID) throw new Error(`Role (${d.id}) in provided roles is not assigned to this guild.`)
            return d.id
        })
        const res = await this.client.patch(`/guilds/${guildID}/members/${userID}`, {
            body: JSON.stringify(sendable),
            headers: { ...(reason ? { "X-Audit-Log-Reason": reason } : {}), ...this.headers }
        })
        
        data = await res.json()
        return new Member(data, this.bot)
    }
    async editSelfNick({ guildID, nick, reason }: { guildID: string, nick?: string, reason?: string }): Promise<string> {
        
        nick = nick ?? ""
        let data
        const res = await this.client.patch(`/guilds/${guildID}/members/@me/nick`, {
            body: JSON.stringify({ nick: nick ?? null }),
            headers: { ...(reason ? { "X-Audit-Log-Reason": reason } : {}), ...this.headers }
        })
        data = await res.text()
        return data
    }
    async addGuildRole(guildID: string, userID: string, roleID: string, reason?: string) {
        
        return this.client.put(`/guilds/${guildID}/members/${userID}/roles/${roleID}`, {
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
    }
    async removeGuildRole(guildID: string, userID: string, roleID: string, reason?: string) {
        
        return this.client.delete(`/guilds/${guildID}/members/${userID}/roles/${roleID}`, {
            headers: reason ? { "X-Audit-Log-Reason": reason } : {} 
        })
    }
    async removeGuildMember(guildID: string, userID: string, reason?: string) {
        
        return this.client.delete(`/guilds/${guildID}/members/${userID}`, { 
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
    }
    async getGuildBans(guildID: string): Promise<GuildBan[]> {
        
        let data
        const res = await this.client.get(`/guilds/${guildID}/bans`)
        
        data = await res.json()
        return data.map(d => new GuildBan(d, this.bot))
    }
    async getGuildBan(guildID: string, userID: string) {
        
        let data
        const res = await this.client.get(`/guilds/${guildID}/bans/${userID}`)
        
        data = await res.json()
        return new GuildBan(data, this.bot)
    }
    async createGuildBan({ guildID, userID, reason, body }: { guildID: string, userID: string, reason?: string, body?: { delete_message_days?: number, reason?: string } }) {
        
        return this.client.put(`/guilds/${guildID}/bans/${userID}`, {
            body: JSON.stringify(body ?? {}),
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
    }
    async removeGuildBan(guildID: string, userID: string, reason?: string) {
        
        return this.client.delete(`/guilds/${guildID}/bans/${userID}`, {
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
    }
    async getGuildRoles(guildID: string): Promise<Role[]> {
        
        let data
        const res = await this.client.get(`/guilds/${guildID}/roles`)
        
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
        
        let data, sendable: any = body
        if (sendable.permissions) sendable.permissions = sendable.permissions.toString
        if (!sendable.color) sendable.color = 0
        const res = await this.client.post(`/guilds/${guildID}/roles`, { 
            body: JSON.stringify(sendable), 
            headers: { ...(reason ? { "X-Audit-Log-Reason": reason } : {}), ...this.headers } 
        })
        
        data = await res.json()
        return new Role(data, this.bot)

    }
    async editGuildRolePosition(guildID: string, roleID: string, position: number, reason?: string) {
        
        let data
        const res = await this.client.patch(`/guilds/${guildID}/roles`, {
            body: JSON.stringify({ id: roleID, position: position }),
            headers: { ...(reason ? { "X-Audit-Log-Reason": reason } : {}), ...this.headers }
        })
        
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
        
        let data, sendable: any = body
        if (sendable.permissions) sendable.permissions = sendable.permissions.toString
        if (!sendable.color) sendable.color = 0
        const res = await this.client.patch(`/guilds/${guildID}/roles/${roleID}`, {
            body: JSON.stringify(sendable),
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
        
        data = await res.json()
        return new Role(data, this.bot)
    }
    async deleteGuildRole(guildID: string, roleID: string, reason?: string) {
        
        return this.client.delete(`/guilds/${guildID}/roles/${roleID}`, { 
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
    }
    async getGuildPruneCount(guildID: string, options?: { days?: number, include_roles?: string[] }): Promise<{ pruned: number }> {
        
        let data, params: string, sendable: any = { ...options }
        if (sendable.include_roles) sendable.roles = sendable.include_roles.join(",")
        params = options ? "?" + Object.keys(sendable).map((v) => `${v}=${options[v]}`).join("&") : ""
        const res = await this.client.get(`/guilds/${guildID}/prune${params}`)
        
        data = await res.json()
        return data
    }
    async beginGuildPrune(guildID: string, body: { days: number, compute_prune_count: boolean, include_roles: string[] }, reason?: string): Promise<{ pruned?: number }> {
        
        let data
        const res = await this.client.post(`/guilds/${guildID}/prune`, { 
            body: JSON.stringify(body),
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
        
        data = await res.json()
        return data
    }
    async getGuildVoiceRegion(guildID: string) {
        
        let data
        const res = await this.client.get(`/guilds/${guildID}/regions`)
        
        data = await res.json()
        return new VoiceRegion(data, this.bot)
    }
    async getGuidInvites(guildID: string): Promise<Invite[]> {
        
        let data
        const res = await this.client.get(`/guilds/${guildID}/invites`)
        
        data = await res.json()
        return data.map(d => new Invite(d, this.bot))
    }
    async getGuidIntegrations(guildID: string): Promise<Integration[]> {
        
        let data
        const res = await this.client.get(`/guilds/${guildID}/integrations`)
        
        data = await res.json()
        return data.map(d => new Integration(data, this.bot))
    }
    async getGuildWidgetSettings(guildID: string): Promise<WidgetSettings> {
        
        let data
        const res = await this.client.get(`/guilds/${guildID}/widget`)
        
        data = await res.json()
        return data
    }
    async editGuildWidgetSettings(guildID: string, options: { enabled?: boolean, channel_id?: string }) {
        
        let data
        const res = await this.client.patch(`/guilds/${guildID}/widget`, {
            body: JSON.stringify(options)
        })
        
        data = await res.json()
        return new Widget(data, this.bot)
    }
    async getGuildWidget(guildID: string) {
        
        let data
        const res = await this.client.get(`/guilds/${guildID}/widget.json`)
        
        data = await res.json()
        return new Widget(data, this.bot)
    }
    async getGuildVanity(guildID: string): Promise<VanityData> {
        
        let data
        const res = await this.client.get(`/guilds/${guildID}/vanity-url`)
        
        data = await res.json()
        return data
    }
    /* Docs Section: Invite */
    async getInvite(inviteCode: string, withCounts?: boolean) {
        let data
        const res = await this.client.get(`/invites/${inviteCode + withCounts ? "?with_counts=true" : ""}`)
        
        data = await res.json()
        return new Invite(data, this.bot)
    }
    async deleteInvite(inviteCode: string, reason?: string) {
        let data
        const res = await this.client.delete(`/invites/${inviteCode}`, { 
            headers: reason ? { "X-Audit-Log-Reason": reason } : {}
        })
        
        data = await res.json()
        return new Invite(data, this.bot)
    }
    /* Docs Section: User */
    async fetchCurrentUser() {
        let data
        const res = await this.client.get("/users/@me")
        
        data = await res.json()
        return new ClientUser(data, this.bot)
    }
    async fetchUser(userID: string) {
        let data
        const res = await this.client.get(`/users/${userID}`)
        
        data = await res.json()
        return new User(data, this.bot)
    }
    async editCurrentUser(body: {
        username?: string,
        avatar?: PetalsFile
    }) {
        let data, sendable: any = body
        if (sendable.avatar) sendable.avatar = await sendable.avatar.stringify()
        const res = await this.client.patch("/users/@me", {
            body: JSON.stringify(sendable)
        })
        data = await res.json()
        return new ClientUser(data, this.bot)
    }
    async leaveGuild(guildID: string) {
        return this.client.delete(`/users/@me/guilds/${guildID}`)
    }
    /* Docs Section: Voice */
    async getVoiceRegions() {
        let data
        const res = await this.client.get("/voice/regions")
        
        data = await res.json()
        return data.map(d => new VoiceRegion(d, this.bot))
    }
    /* Docs Section: Webhook TODO */
    /* Docs Section: Slash Commands TODO */
    private async createGlobalSlashCommand(body: { name: string, description: string, options?: SlashCommandOptions }) {
        let data
        const res = await this.client.post(`/applications/${this.bot.user.id}/commands`)
        
        data = await res.json()
        return new SlashCommand(data, this.bot)
    }
    /* Docs Section: Misc */
    async getAppInfo() {
        let data
        const res = await this.client.get("/oauth2/applications/@me")
        data = await res.json()
        return new Application(data, this.bot)
    }
    async getBotGateway() {
        const res = await this.client.get("/gateway/bot")
        return await res.json()
    }
}
export default HTTP