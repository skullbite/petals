import OP from "./orchidclient"
import type RawClient from "../client"
import * as fd from "form-data"
// Model Imports
import Message from "../models/message"
import PermissionOverwrites from "../models/permissionoverwrite"
import Invite from "../models/invite"
import * as RESTErrors from "../error"
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
// Type Imports
import type PetalsFile from "../models/file"
import type Embed from "../models/embed"
import type { HttpResponse } from "@augu/orchid"
import Widget from "../models/widget"
import MultipartData from "../utils/multipartdata"
import { from } from "form-data"
import axios from "axios"

interface WidgetSettings {
    enabled: boolean
    channel_id: string
}
interface VanityData {
    code?: string
    uses: number
}

class HTTP {
    private readonly _bot: RawClient
    client: OP 
    constructor(bot: RawClient) {
        this._bot = bot
        this.client = new OP(this._bot)
    }
    raiseForStatus(intendedStatus: number, res: HttpResponse) {
        let data
        try {
            data = res.json()
        }
        catch {
            return // assumption: it worked 
        }
        switch (res.statusCode) {
            case intendedStatus: return
            case 400: throw new RESTErrors.BadRequest(`${data.code}: ${data.message}`)
            case 401: throw new RESTErrors.Unauthorized(`${data.code}: ${data.message}`)
            case 403: throw new RESTErrors.Forbidden(`${data.code}: ${data.message}`)
            case 404: throw new RESTErrors.NotFound(`${data.code}: ${data.message}`)
            case 405: throw new RESTErrors.MethodNotAllowed(`${data.code}: ${data.message}`)
            case 429: throw new RESTErrors.Ratelimited(`${data.code}: ${data.message}`)
        }
    }
    /* Docs Section: Audit Logs */
    async getAuditLogs(guildID: string, options?: {
        user_id?: string,
        action_type?: number,
        before?: string,
        limit?: number
    }): Promise<AuditLogEntry[]> {
        let data, params: string
        params = options ? "?" + Object.keys(options).map((v) => `${v}=${options[v]}`).join("&") : ""
        const res = await this.client.get(`/guilds/${guildID}/audit-logs${params}`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data.map(d => new AuditLogEntry(d, this._bot))
    }
    /* Docs Section: Channels
       Description: Actual Channel Stuff
    */
    async createDM(userID: string) {
        let data
        const res = await this.client.post("/users/@me/channels", {
            data: { recipient_id: userID }
        })
        this.raiseForStatus(200, res)
        data = res.json()
        return new channels.DMChannel(data, this._bot)
    }
    async getChannel(channelID: string) {
        let data
        const res = await this.client.get(`/channels/${channelID}`)
        this.raiseForStatus(200, res)
        data = res.json()
        switch (data.type) {
            case 0: return new channels.TextChannel(data, this._bot)
            case 1: return new channels.DMChannel(data, this._bot)
            case 2: return new channels.VoiceChannel(data, this._bot)
            case 4: return new channels.ChannelCategory(data, this._bot)
            case 5: return new channels.NewsChannel(data, this._bot)
            case 6: return new channels.StoreChannel(data, this._bot)
            default: throw new TypeError("wtf is this a new channel type")
        }
    }
    async deleteChannel(channelID: string) {
        const res = await this.client.delete(`/channels/${channelID}`)
        this.raiseForStatus(204, res)
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
        let data, sendable: any = { ...body }
        if (sendable.permission_overwrites) sendable.permission_overwrites = sendable.permission_overwrites.map(a => a.toJSON)
        const res = await this.client.request({
            method: "PATCH",
            url: `channels/${channelID}`,
            data: sendable
        })
        data = res.json()
        this.raiseForStatus(200, res)
        switch (data.type) {
            case 0: return new channels.TextChannel(data, this._bot)
            case 2: return new channels.VoiceChannel(data, this._bot)
            case 4: return new channels.ChannelCategory(data, this._bot)
            case 5: return new channels.NewsChannel(data, this._bot)
            case 6: return new channels.StoreChannel(data, this._bot)
            default: throw new TypeError("wtf is this a new channel type")
        }
    }
    async editChannelPermissions(channelID: string, overwriteID: string, overwrite: PermissionOverwrites) {
        const res = await this.client.request({
            method: "PUT",
            url: `/channels/${channelID}/permissions/${overwriteID}`,
            data: overwrite.toJSON
        })
        this.raiseForStatus(204, res)
    }
    async deleteChannelPermissions(channelID: string, overwriteID: string) {
        const res = await this.client.delete(`/channels/${channelID}/permissions/${overwriteID}`)
        this.raiseForStatus(204, res)
    }
    async getChannelInvites(channelID: string): Promise<Invite[]> {
        let data
        const res = await this.client.get(`/channels/${channelID}/invites`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data.map(d => new Invite(d, this._bot))
    }
    async createChannelInvite(channelID: string, body: { 
        max_age?: number,
        max_uses?: number,
        temporary?: boolean,
        unique?: boolean,
        target_user?: string
    }) {
        let data
        const res = await this.client.post(`/channels/${channelID}/invites`, { data: body })
        this.raiseForStatus(200, res)
        data = res.json()
        return new Invite(data, this._bot)
    }
    async followNewsChannel(channelID: string, channelToFollow: string) {
        let data
        const res = await this.client.post(`/channels/${channelID}/followers`, {
            data: { webhook_channel_id: channelToFollow }
        })
        this.raiseForStatus(200, res)
        data = res.json()
        return data
    }
    async sendTyping(channelID: string) {
        const res = await this.client.post(`/channels/${channelID}/typing`, { headers: this.client.headers })
        this.raiseForStatus(204, res)
    }
    async getPinnedMessages(channelID: string): Promise<Message[]> {
        let data
        const res = await this.client.get(`/channels/${channelID}/pins`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data.map(d => new Message(d, this._bot))
    }
    async addPinnedMessage(channelID: string, messageID: string) {
        const res = await this.client.request({
            method: "PUT",
            url: `/channels/${channelID}/pins/${messageID}`
        })
        this.raiseForStatus(204, res)
    }
    async deletePinnedMessage(channelID: string, messageID: string) {
        const res = await this.client.delete(`/channels/${channelID}/pins/${messageID}`)
        this.raiseForStatus(204, res)
    }
    /* Docs Section: Channels
       Description: Messages
    */
    async getMessage(channelID: string, messageID: string) {
        let data
        const res = await this.client.get(`/channels/${channelID}/messages/${messageID}`)
        this.raiseForStatus(200, res)
        data = res.json()
        return new Message(data, this._bot)
    }
    async sendMessage(channelID: string, body: {
        content?: string,
        tts?: boolean,
        embed?: Embed,
        file?: PetalsFile,
        message_reference?: {
            message_id: string,
            channel_id?: string,
            guild_id?: string
        }
    }) {
        let data, form: fd, sendable: any = { embed: body.embed, message_reference: body.message_reference }, headers
        
        form = new fd()
        if (body.content) form.append("content", body.content)
        if (body.file) form.append("file", body.file.buffer, body.file.name)
        if (sendable.embed) sendable.embed = sendable.embed.toJSON
        form.append("payload_json", JSON.stringify(sendable), { contentType: "application/json" })
        headers = {
            ...this.client.headers,
            ...form.getHeaders()
        }
        /* const res = await this.client.post(`/channels/${channelID}/messages`, { data: form.getBuffer, headers: headers })
        console.log(res.json())
        this.raiseForStatus(200, res)
        data = res.json() */
        return new Message(data, this._bot)
    }
    async deleteMessage(channelID: string, messageID: string) {
        const res = await this.client.delete(`/channels/${channelID}/messages/${messageID}`)
        this.raiseForStatus(204, res)
    }
    async bulkDeleteMessages(channelID: string, messageIDs: string[]) {
        const res = await this.client.post(`/channels/${channelID}/messages/bulk-delete`, { data: { messages: messageIDs } })
        this.raiseForStatus(204, res)
    }
    async editMessage(channelID: string, messageID: string, body: {
        content?: string,
        embed?: any,
        flags?: any,
        allowed_mentions?: any
    }) {
        let data
        const res = await this.client.request({
            method: "PATCH",
            url: `/channels/${channelID}/messages/${messageID}`,
            data: body
        })
        this.raiseForStatus(200, res)
        data = res.json()
        return new Message(data, this._bot)
    }
    async crosspostMessage(channelID: string, messageID: string) {
        let data
        const res = await this.client.post(`/channels/${channelID}/messages/${messageID}/crosspost`)
        this.raiseForStatus(200, res)
        data = res.json()
        return new Message(data, this._bot)
    }
    /* Docs Section: Channels
       Description: Reactions 
    */
    async addReaction(channelID: string, messageID: string, emoji: Emoji|string) {
        let safeEmoji
        switch (typeof emoji) {
            case "string": 
                safeEmoji = emoji
                break
            case "object": 
                safeEmoji = emoji.toString
                break
        }
        safeEmoji = encodeURIComponent(safeEmoji)
        const res = await this.client.request({
            method: "put",
            url: `/channels/${channelID}/messages/${messageID}/reactions/${safeEmoji}/@me`
        })
        this.raiseForStatus(204, res)
    }
    async removeUserReaction(channelID: string, messageID: string, emoji: Emoji|string, userID?: string) {
        let safeEmoji
        switch (typeof emoji) {
            case "string": 
                safeEmoji = emoji
                break
            case "object": 
                safeEmoji = emoji.toString
                break
        }
        safeEmoji = encodeURIComponent(safeEmoji)
        const res = await this.client.delete(`/channels/${channelID}/messages/${messageID}/reactions/${safeEmoji}/${userID ?? "@me"}`)
        this.raiseForStatus(204, res)
    }
    async getReactions(channelID: string, messageID: string, emoji: Emoji|string, options?: { before?: string, after?: string, limit?: number }): Promise<User[]> {
        let data, safeEmoji: string, params: string
        switch (typeof emoji) {
            case "string": 
                safeEmoji = emoji
                break
            case "object": 
                safeEmoji = emoji.toString
                break
        }
        safeEmoji = encodeURIComponent(safeEmoji)
        params = options ? "?" + Object.keys(options).map((v) => `${v}=${options[v]}`).join("&") : ""
        const res = await this.client.get(`/channels/${channelID}/messages/${messageID}/reactions/${safeEmoji}${params}`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data.map(d => new User(d, this._bot))
    }
    async deleteReactions(channelID: string, messageID: string, emoji?: Emoji|string) {
        let safeEmoji: string
        if (emoji) {
            switch (typeof emoji) {
                case "string": 
                    safeEmoji = emoji
                    break
                case "object": 
                    safeEmoji = emoji.toString
                    break
            }
            safeEmoji = "/" + encodeURIComponent(safeEmoji)
        }
        const res = await this.client.delete(`/channels/${channelID}/messages/${messageID}${safeEmoji ?? ""}`)
        this.raiseForStatus(204, res)
    }
    /* Docs Section: Emoji */
    async listGuildEmojis(guildID: string): Promise<Emoji[]> {
        let data
        const res = await this.client.get(`/guild/${guildID}/emojis`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data.map(d => new Emoji(d, this._bot))
    }
    async getGuildEmoji(guildID: string, emojiID: string) {
        let data
        const res = await this.client.get(`/guilds/${guildID}/emojis/${emojiID}`)
        this.raiseForStatus(200, res)
        data = res.json()
        return new Emoji(data, this._bot)
    }
    // TODO: RETURN TO CREATE EMOJI ENDPOINT
    async editGuildEmoji(guildID: string, emojiID: string, options: { name?: string, roles?: string[] }) {
        let data 
        const res = await this.client.request({
            method: "PATCH",
            url: `/guilds/${guildID}/emojis/${emojiID}`,
            data: options
        })
        this.raiseForStatus(200, res)
        data = res.json()
        return new Emoji(data, this._bot)    
    }
    async deleteGuildEmoji(guildID: string, emojiID: string) {
        const res = await this.client.delete(`/guilds/${guildID}/emojis/${emojiID}`)
        this.raiseForStatus(200, res)
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
        let data, sendable: any = { ...body }
        if (sendable.roles) {
            sendable.roles = sendable.roles.map(d => {
                if (d.permissions) d.permissions = d.permissions.toString
                if (!d.color) d.color = 0
            })
        }
        if (sendable.icon) sendable.icon = await sendable.icon.stringify()
        const res = await this.client.post("/guilds", { data: sendable })
        this.raiseForStatus(200, res)
        data = res.json()
        return new Guild(data, this._bot)
    }
    async getGuild(guildID: string, withCounts?: boolean) {
        let data
        const res = await this.client.get(`/guilds/${guildID + withCounts ? "?with_counts=true" : ""}`)
        this.raiseForStatus(200, res)
        data = res.json()
        return new Guild(data, this._bot)
    }
    async getGuildPreview(guildID: string) {
        let data
        const res = await this.client.get(`/guilds/${guildID}/preview`)
        this.raiseForStatus(200, res)
        data = res.json()
        return new PartialGuild(data, this._bot)
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
    }) {
        let data, sendable: any = { ...body }
        if (sendable.icon) sendable.icon = await sendable.icon.stringify()
        if (sendable.banner) sendable.banner = await sendable.banner.stringify()
        if (sendable.splash) sendable.splash = await sendable.splash.stringify()
        const res = await this.client.request({
            method: "PATCH",
            url: `guild/${guildID}`,
            data: sendable
        })
        this.raiseForStatus(200, res)
        data = res.json()
        
        return new Guild(data, this._bot)
    }
    async deleteGuild(guildID: string) {
        const res = await this.client.delete(`/guild/${guildID}`)
        this.raiseForStatus(204, res)
    }
    async getGuildChannels(guildID: string): Promise<channels.GuildChannels> {
        let data
        const res = await this.client.get(`/guild/${guildID}/channels`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data.map(d => {
            switch (data.type) {
                case 0: return new channels.TextChannel(data, this._bot)
                case 2: return new channels.VoiceChannel(data, this._bot)
                case 4: return new channels.ChannelCategory(data, this._bot)
                case 5: return new channels.NewsChannel(data, this._bot)
                case 6: return new channels.StoreChannel(data, this._bot)
                default: throw new TypeError("wtf is this a new channel type")
            }
        })
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
        let data, sendable: any = { ...body }
        const res = await this.client.post(`/guilds/${guildID}/channels`, { data: sendable })
        this.raiseForStatus(200, res)
        data = res.json()
        switch (data.type) {
            case 0: return new channels.TextChannel(data, this._bot)
            case 2: return new channels.VoiceChannel(data, this._bot)
            case 4: return new channels.ChannelCategory(data, this._bot)
            case 5: return new channels.NewsChannel(data, this._bot)
            case 6: return new channels.StoreChannel(data, this._bot)
            default: throw new TypeError("wtf is this a new channel type")
        }
    }
    async editChannelPositions(guildID: string, channelID: string, position: number) {
        const res = await this.client.request({
            method: "PATCH",
            url: `/guilds/${guildID}/channels`,
            data: {
                id: channelID,
                position: position
            }
        })
        this.raiseForStatus(204, res)
    }
    async getGuildMember(guildID: string, userID: string) {
        let data
        const res = await this.client.get(`/guilds/${guildID}/members/${userID}`)
        this.raiseForStatus(200, res)
        data = res.json()
        return new Member(data, this._bot)
    }
    async listGuildMembers(guildID: string, options: { limit?: number, after?: string }): Promise<Member[]> {
        let data, params: string
        params = options ? "?" + Object.keys(options).map((v) => `${v}=${options[v]}`).join("&") : ""
        const res = await this.client.get(`/guilds/${guildID}/members${params}`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data.map(d => new Member(d, this._bot))
    }
    async editGuildMember(guildID: string, userID: string, body: { 
        nick?: string, 
        roles?: Role[], 
        mute?: boolean, 
        deaf?: boolean,
        channel_id?: string
    }) {
        let data, sendable: any = { ...body }
        if (sendable.roles) sendable.roles = sendable.roles.map(d =>{
            if (d.guildID !== guildID) throw new Error(`Role (${d.id}) in provided roles is not assigned to this guild.`)
            return d.id
        })
        const res = await this.client.request({
            method: "PATCH",
            url: `/guilds/${guildID}/members/${userID}`,
            data: sendable
        })
        this.raiseForStatus(200, res)
        data = res.json()
        return new Member(data, this._bot)
    }
    async editSelfNick(guildID: string, nick?: string): Promise<string> {
        nick = nick ?? ""
        let data
        const res = await this.client.request({
            method: "PATCH",
            url: `/guilds/${guildID}/members/@me/nick`,
            data: { nick: nick ?? null }
        })
        this.raiseForStatus(200, res)
        data = res.text()
        return data
    }
    async addGuildRole(guildID: string, userID: string, roleID: string) {
        const res = await this.client.request({
            method: "PUT",
            url: `/guilds/${guildID}/members/${userID}/roles/${roleID}`
        })
        this.raiseForStatus(204, res)
    }
    async removeGuildRole(guildID: string, userID: string, roleID: string) {
        const res = await this.client.delete(`/guilds/${guildID}/members/${userID}/roles/${roleID}`)
        this.raiseForStatus(204, res)
    }
    async removeGuildMember(guildID: string, userID: string) {
        const res = await this.client.delete(`/guilds/${guildID}/members/${userID}`)
        this.raiseForStatus(204, res)
    }
    async getGuildBans(guildID: string): Promise<GuildBan[]> {
        let data
        const res = await this.client.get(`/guilds/${guildID}/bans`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data.map(d => new GuildBan(d, this._bot))
    }
    async getGuildBan(guildID: string, userID: string) {
        let data
        const res = await this.client.get(`/guilds/${guildID}/bans/${userID}`)
        this.raiseForStatus(200, res)
        data = res.json()
        return new GuildBan(data, this._bot)
    }
    async createGuildBan(guildID: string, userID: string, body?: { delete_message_days?: number, reason?: string }) {
        const res = await this.client.request({
            method: "PUT",
            url: `/guilds/${guildID}/bans/${userID}`,
            data: body ?? {}
        })
        this.raiseForStatus(204, res)
    }
    async removeGuildBan(guildID: string, userID: string) {
        const res = await this.client.delete(`/guilds/${guildID}/bans/${userID}`)
        this.raiseForStatus(204, res)
    }
    async getGuildRoles(guildID: string): Promise<Role[]> {
        let data
        const res = await this.client.get(`/guilds/${guildID}/roles`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data.map(d => new Role(d, this._bot))
    }
    async createGuildRole(guildID: string, body: {
        name?: string,
        color?: number,
        hoist?: boolean,
        mentionable?: boolean,
        permissions?: PetalsPermissions
    }) {
        let data, sendable: any = { ...body }
        if (sendable.permissions) sendable.permissions = sendable.permissions.toString
        if (!sendable.color) sendable.color = 0
        const res = await this.client.post(`/guilds/${guildID}/roles`, { data: sendable })
        this.raiseForStatus(200, res)
        data = res.json()
        return new Role(data, this._bot)

    }
    async editGuildRolePosition(guildID: string, roleID: string, position: number) {
        let data
        const res = await this.client.request({
            method: "PATCH",
            url: `/guilds/${guildID}/roles`,
            data: { id: roleID, position: position }
        })
        this.raiseForStatus(200, res)
        data = res.json()
        return new Role(data, this._bot)
    }
    async editGuildRole(guildID: string, roleID: string, body: {
        name?: string,
        color?: number,
        hoist?: boolean,
        mentionable?: boolean,
        permissions?: PetalsPermissions
    }) {
        let data, sendable: any = { ...body }
        if (sendable.permissions) sendable.permissions = sendable.permissions.toString
        if (!sendable.color) sendable.color = 0
        const res = await this.client.request({
            method: "PATCH",
            url: `/guilds/${guildID}/roles/${roleID}`,
            data: sendable
        })
        this.raiseForStatus(200, res)
        data = res.json()
        return new Role(data, this._bot)
    }
    async deleteGuildRole(guildID: string, roleID: string) {
        const res = await this.client.delete(`/guilds/${guildID}/roles/${roleID}`)
        this.raiseForStatus(204, res)
    }
    async getGuildPruneCount(guildID: string, options?: { days?: number, include_roles?: string[] }): Promise<{ pruned: number }> {
        let data, params: string, sendable: any = { ...options }
        if (sendable.include_roles) sendable.roles = sendable.include_roles.join(",")
        params = options ? "?" + Object.keys(sendable).map((v) => `${v}=${options[v]}`).join("&") : ""
        const res = await this.client.get(`/guilds/${guildID}/prune${params}`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data
    }
    async beginGuildPrune(guildID: string, body: { days: number, compute_prune_count: boolean, include_roles: string[] }): Promise<{ pruned?: number }> {
        let data
        const res = await this.client.post(`/guilds/${guildID}/prune`, { data: body })
        this.raiseForStatus(200, res)
        data = res.json()
        return data
    }
    async getGuildVoiceRegion(guildID: string) {
        let data
        const res = await this.client.get(`/guilds/${guildID}/regions`)
        this.raiseForStatus(200, res)
        data = res.json()
        return new VoiceRegion(data, this._bot)
    }
    async getGuidInvites(guildID: string): Promise<Invite[]> {
        let data
        const res = await this.client.get(`/guilds/${guildID}/invites`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data.map(d => new Invite(d, this._bot))
    }
    async getGuidIntegrations(guildID: string): Promise<Integration[]> {
        let data
        const res = await this.client.get(`/guilds/${guildID}/integrations`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data.map(d => new Integration(data, this._bot))
    }
    async getGuildWidgetSettings(guildID: string): Promise<WidgetSettings> {
        let data
        const res = await this.client.get(`/guilds/${guildID}/widget`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data
    }
    async editGuildWidgetSettings(guildID: string, options: { enabled?: boolean, channel_id?: string }) {
        let data
        const res = await this.client.request({
            method: "PATCH",
            url: `/guilds/${guildID}/widget`,
            data: options
        })
        this.raiseForStatus(200, res)
        data = res.json()
        return new Widget(data, this._bot)
    }
    async getGuildWidget(guildID: string) {
        let data
        const res = await this.client.get(`/guilds/${guildID}/widget.json`)
        this.raiseForStatus(200, res)
        data = res.json()
        return new Widget(data, this._bot)
    }
    async getGuildVanity(guildID: string): Promise<VanityData> {
        let data
        const res = await this.client.get(`/guilds/${guildID}/vanity-url`)
        this.raiseForStatus(200, res)
        data = res.json()
        return data
    }
    async getGuildWidgetImage(guildID: string, style: "shield"|"banner1"|"banner2"|"banner3"|"banner4") {
        return `https://discord.com/api/v8/guilds/${guildID}/widget.png?style=${style}`
    }
    /* Docs Section: Invite */
    async getInvite(inviteCode: string, withCounts?: boolean) {
        let data
        const res = await this.client.get(`/invites/${inviteCode + withCounts ? "?with_counts=true" : ""}`)
        this.raiseForStatus(200, res)
        data = res.json()
        return new Invite(data, this._bot)
    }
    async deleteInvite(inviteCode: string) {
        let data
        const res = await this.client.delete(`/invites/${inviteCode}`)
        this.raiseForStatus(200, res)
        data = res.json()
        return new Invite(data, this._bot)
    }
    /* Docs Section: User */
    async fetchCurrentUser() {
        let data
        const res = await this.client.get("/users/@me")
        this.raiseForStatus(200, res)
        data = res.json()
        return new ClientUser(data, this._bot)
    }
    async fetchUser(userID: string) {
        let data
        const res = await this.client.get(`/users/${userID}`)
        this.raiseForStatus(200, res)
        data = res.json()
        return new User(data, this._bot)
    }
    async editCurrentUser(body: {
        username?: string,
        avatar?: PetalsFile
    }) {
        let data, sendable: any = { ...body }
        if (sendable.avatar) sendable.avatar = sendable.avatar.stringify()
        const res = await this.client.request({
            method: "PATCH",
            url: "/users/@me",
            data: sendable
        })
        this.raiseForStatus(200, res)
        data = res.json()
        return new ClientUser(data, this._bot)
    }
    async leaveGuild(guildID: string) {
        const res = await this.client.delete(`/users/@me/guilds/${guildID}`)
        this.raiseForStatus(204, res)
    }
    /* Docs Section: Voice */
    async getVoiceRegions() {
        let data
        const res = await this.client.get("/voice/regions")
        this.raiseForStatus(200, res)
        data = res.json()
        return data.map(d => new VoiceRegion(d, this._bot))
    }
    /* Docs Section: Webhook TODO */

}
export default HTTP