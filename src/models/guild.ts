import Base from "./base"
import * as c from "./channel"
import { Member, User } from "./user"
import type RawClient from "../client"
import type { statusTypes } from "../client"
import Role from "./role"
import Emoji from "./emoji"
import Pile from "../utils/pile"
import PermissionOverwrite from "./permissionoverwrite"
import PetalsPermissions from "./permissions"
import * as cdn from "../http/cdn"
import FlagHandler from "../utils/flagcalc"
import { SubsetPermissions } from "./interactions/permissions"
import { SlashTemplate } from "./interactions/command"

interface WidgetSettings {
    enabled: boolean
    channel_id: string
}
const activityFlags = {
    INSTANCE: 1 << 0,
    JOIN: 1 << 1,
    SPECTATE: 1 << 2,
    JOIN_REQUEST: 1 << 3,
    SYNC: 1 << 4,
    PLAY: 1 << 5
}

const systemChannelFlags = {
    SUPPRESS_JOIN_NOTIFICATIONS: 1 << 0,
    SUPPRESS_PREMIUM_SUBSCRIPTIONS: 1 << 1
}

class Activity {
    name: string
    type: 0|1|2|3|4|5|6
    url?: string
    createdAt?: Date
    timestamps?: number[]
    applicationID?: string
    details?: string
    state?: string
    emoji?: { name: string, id?: string, animated?: boolean }
    party?: { id?: string, size?: [number, number] }
    assets?: { large_image?: string, large_text?: string, small_image?: string, small_text?: string }
    instance?: boolean
    flags?: FlagHandler
    constructor(data) {
        const { name, type, url, created_at, timestamps, application_id, details, state, emoji, party, assets, instance, flags } = data
        this.name = name
        this.type = type
        this.url = url
        this.createdAt = new Date(created_at)
        this.timestamps = timestamps
        this.applicationID = application_id
        this.details = details
        this.state = state
        this.emoji = emoji
        this.party = party
        this.assets = assets
        this.instance = instance
        this.flags = flags ? new FlagHandler(flags, activityFlags) : undefined
    }
}
class Prensence {
    user: User
    guild: Guild
    status: statusTypes
    activities: Activity[]
    clientStatus: { desktop?: statusTypes, mobile?: statusTypes, web?: statusTypes }
    constructor(data, bot: RawClient) {
        const { user, guild_id, status, activities, client_status } = data
        this.user = new User(user, bot)
        this.guild = bot.guilds.get(guild_id)
        this.status = status
        this.activities = activities.map(d => new Activity(d))
        this.clientStatus = client_status
    }
}

export class PartialGuild extends Base {
    name: string
    splash?: string
    banner?: string
    description?: string
    icon?: string
    features?: string[]
    verificationLevel: number
    vanityURLCode?: string
    approximateMemberCount?: number
    approximatePresenceCount?: number
    constructor(data, bot) {
        super(data.id, bot) 
        const { name, splash, banner, description, icon, features, verification_level, vanity_url_code, approximate_member_count, approximate_presence_count } = data
        this.name = name
        this.splash = splash
        this.banner = banner
        this.description = description
        this.icon = icon
        this.features = features
        this.verificationLevel = verification_level
        this.vanityURLCode = vanity_url_code
        this.approximateMemberCount = approximate_member_count
        this.approximatePresenceCount = approximate_presence_count
    }
    get splashURL() {
        return this.splash ? cdn.guildSplashURL(this.id, this.splash) : undefined
    }
    get iconURL() {
        return this.icon ? cdn.guildIconURL(this.id, this.icon) : undefined
    }
    get bannerURL() {
        return this.icon ? cdn.guildBannerURL(this.id, this.banner) : undefined
    }
}

export class Guild extends PartialGuild {
    region: string
    roles: Pile<string, Role>
    emojis: Pile<string, Emoji>
    members: Pile<string, Member>
    joinedAt: Date
    discoverySplash?: string
    updatesChannel?: c.GuildTextable
    systemChannel?: c.GuildTextable
    systemChannelFlags?: string[]
    rulesChannel?: c.GuildTextable
    afkChannel?: c.VoiceChannel
    channels: Pile<string, c.GuildChannels>
    boosterCount: number
    defaultMessageNotifications: number
    explicitContentFilter: number
    mfaLevel: number
    ownerID: string
    presences?: Prensence[]
    preferredLocale?: string
    memberCount: number
    afkTimeout?: number
    unavailible: boolean
    large: boolean
    boostLevel: number
    constructor(data, bot: RawClient) {
        super(data, bot)
        this._bot.guilds.set(this.id, this)
        const { 
            description, 
            region, 
            roles, 
            joined_at, 
            discovery_splash,
            public_updates_channel_id,
            premium_subscription_count,
            mfa_level,
            system_channel_id,
            owner_id,
            channels,
            features,
            presences,
            splash,
            preferred_locale,
            member_count,
            banner,
            rules_channel_id,
            afk_timeout,
            unavailible,
            members,
            default_message_notifications,
            large,
            afk_channel_id,
            system_channel_flags,
            explicit_content_filter,
            premium_tier,
            emojis
        } = data
        this.description = description
        this.region = region
        this.roles = new Pile 
        roles.map(d => {
            Object.assign(d, { guild_id: this.id })
            this.roles.set(d.id, new Role(d, this._bot)) 
        })
        this.emojis = new Pile
        emojis.map(d => {
            Object.assign(d, { guild_id: this.id })
            this.emojis.set(d.id, new Emoji(d, this._bot)) 
        })
        this.members = new Pile
        if (members) members.map(d => {
            Object.assign(d, { guild_id: this.id })
            this.members.set(d.user.id, new Member(d, bot))
        })
        if (presences) this.presences = presences.map(d => new Prensence(d, this._bot))
        this.channels = new Pile
        if (channels) channels.map(d => {
            Object.assign(d, { guild_id: this.id })
            switch (d.type) {
            case 0:
                this.channels.set(d.id, new c.TextChannel(d, this._bot))
                break
            case 2:
                this.channels.set(d.id, new c.VoiceChannel(d, this._bot))
                break
            case 4:
                this.channels.set(d.id, new c.ChannelCategory(d, this._bot))
                break
            case 5:
                this.channels.set(d.id, new c.NewsChannel(d, this._bot))
                break
            case 6:
                this.channels.set(d.id, new c.StoreChannel(d, this._bot))
                break
            case 13:
                this.channels.set(d.id, new c.StageChannel(d, this._bot))
                break
            }
        })
        this.joinedAt = new Date(joined_at)
        this.discoverySplash = discovery_splash
        this.updatesChannel = this.channels.get(public_updates_channel_id) as c.GuildTextable
        this.rulesChannel = this.channels.get(rules_channel_id) as c.GuildTextable
        this.systemChannel = this.channels.get(system_channel_id) as c.GuildTextable
        if (this.systemChannel) this.systemChannelFlags = Object.keys(system_channel_flags).map(d => { if ((system_channel_flags & systemChannelFlags[d]) === systemChannelFlags[d]) return d })
        this.afkChannel = this.channels.get(afk_channel_id) as c.VoiceChannel
        this.boosterCount = premium_subscription_count
        this.mfaLevel = mfa_level
        this.ownerID = owner_id
        this.features = features
        this.splash = splash
        this.preferredLocale = preferred_locale
        this.explicitContentFilter = explicit_content_filter
        this.defaultMessageNotifications = default_message_notifications
        this.memberCount = member_count
        this.banner = banner
        this.afkTimeout = afk_timeout
        this.unavailible = unavailible
        this.boostLevel = premium_tier
        this.large = large
    }
    get channelsInOrder() {
        return Array.from(this.channels.values()).sort((a, b) => b.position - a.position)
    }
    async getAllSlashPermissions() {
        return this._bot.http.getAllGuildCommandPermissions(this.id)
    }
    async editSlashPermissions(commandID: string, permissions: SubsetPermissions[]) {
        return this._bot.http.editGuildCommandPermissions(this.id, commandID, permissions)
    }
    async getAuditLogs(options?: {
        user_id?: string,
        action_type?: number,
        before?: string,
        limit?: number
    }) {
        return this._bot.http.getAuditLogs(this.id, options ?? {})
    }
    async edit(opts: {
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
    }) {
        return this._bot.http.editGuild(this.id, opts)
    }
    async delete() {
        this._bot.http.deleteGuild(this.id)
    }
    async fetchChannels() {
        return this._bot.http.getGuildChannels(this.id)
    }
    async createChannel(opts: {
        name: string,
        type?: 0|2|4|5|6|13,
        position?: number,
        topic?: string,
        nsfw?: boolean,
        rate_limit_per_user?: number,
        bitrate?: number,
        user_limit?: number
        permission_overwrites?: PermissionOverwrite[]
        parent_id?: string
    }) {
        return this._bot.http.createGuildChannel(this.id, opts)
    }
    async createEmoji(body: {
        name: string,
        image: Buffer, 
        roles?: string[]
    }) {
        return this._bot.http.createGuildEmoji(this.id, body)
    }
    async fetchEmoji(emojiID: string) {
        return this._bot.http.getGuildEmoji(this.id, emojiID)
    }
    async fetchEmojis() {
        return this._bot.http.listGuildEmojis(this.id)
    }
    async editEmoji(emojiID: string, options: { name?: string, roles?: string[] }) {
        return this._bot.http.editGuildEmoji(this.id, emojiID, options)
    }
    async deleteEmoji(emojiID: string) {
        await this._bot.http.deleteGuildEmoji(this.id, emojiID)
    }
    async fetchCommands() {
        return this._bot.http.getGuildSlashCommands(this.id)
    }
    async fetchCommand(commandID: string) {
        return this._bot.http.getGuildSlashCommand(this.id, commandID)
    }
    async createCommand(body: SlashTemplate) {
        return this._bot.http.createGuildSlashCommand(this.id, body)
    }
    async editCommand(commandID: string, body: SlashTemplate) {
        return this._bot.http.editGuildSlashCommand(this.id, commandID, body)
    }
    async deleteCommand(commandID: string) {
        return this._bot.http.deleteGuildSlashCommand(this.id, commandID)
    }
    async massEditCommands(body: SlashTemplate[]) {
        return this._bot.http.overwriteGuildSlashCommands(this.id, body)
    }
    async fetchCommandPermissions() {
        return this._bot.http.getAllGuildCommandPermissions(this.id)
    }
    async editCommandPermissions(commandID: string, permissions: SubsetPermissions[]) {
        await this._bot.http.editGuildCommandPermissions(this.id, commandID, permissions)
    }
    async massEditCommandPermissions(permissions: { id: string, permissons: SubsetPermissions[] }[]) {
        await this._bot.http.massEditGuildSlashCommandPermissions(this.id, permissions)
    }
    async repositionChannel(channelID: string, position: number, reason?: string) {
        await this._bot.http.editChannelPositions(this.id, channelID, position, reason ?? "")
    }
    async fetchMember(userID: string) {
        return this._bot.http.getGuildMember(this.id, userID)
    }
    async fetchMembers(opts: { limit?: number, after?: string }) {
        return this._bot.http.listGuildMembers(this.id, opts)
    }
    async changeNick(nick?: string, reason?: string) {
        await this._bot.http.editSelfNick(this.id, { nick: nick, reason: reason ?? ""})
    }
    async fetchAllBans() {
        return this._bot.http.getGuildBans(this.id)
    }
    async fetchBan(userID: string) {
        return this._bot.http.getGuildBan(this.id, userID)
    }
    async kick(memberID: string, reason?: string) {
        return this._bot.http.removeGuildMember(this.id, memberID, reason ?? "")
    }
    async ban(userID: string, opts?: { delete_message_days?: number, reason?: string }) {
        return this._bot.http.createGuildBan(this.id, { userID: userID, body: opts })
    }
    async unban(userID: string, reason?: string) {
        await this._bot.http.removeGuildBan(this.id, userID, reason ?? "")
    }
    async fetchAllRoles() {
        return this._bot.http.getGuildRoles(this.id)
    }
    async createRole(options: {
        name?: string,
        color?: number,
        hoist?: boolean,
        mentionable?: boolean,
        permissions?: PetalsPermissions
    }) {
        return this._bot.http.createGuildRole(this.id, options)
    }
    async repositionRole(roleID: string, position: number) {
        return this._bot.http.editGuildRolePosition(this.id, roleID, position)
    }
    async calculatePruneCount(opts?: { days?: number, include_roles?: string[] }) {
        return this._bot.http.getGuildPruneCount(this.id, opts)
    }
    async prune(opts: { days: number, compute_prune_count: boolean, include_roles: string[] }) {
        return this._bot.http.beginGuildPrune(this.id, opts)
    }
    async getVoiceRegion() {
        return this._bot.http.getGuildVoiceRegion(this.id)
    }
    async fetchInvites() {
        return this._bot.http.getGuidInvites(this.id)
    }
    async getWidgetSettings(): Promise<WidgetSettings> {
        return this._bot.http.getGuildWidgetSettings(this.id)
    }
    async editWidgetSettings(opts: { enabled?: boolean, channel_id?: string }) {
        return this._bot.http.editGuildWidgetSettings(this.id, opts)
    }
    async fetchIntegrations() {
        return this._bot.http.getGuidIntegrations(this.id)
    }
    getWidget(style: "shield" | "banner1" | "banner2" | "banner3" | "banner4") {
        return cdn.guildWidgetImage(this.id, style)
    }
    get rolesInOrder() {
        return Array.from(this.roles.values()).sort((a, b) => b.position - a.position)
    }
    get owner() {
        return this.members.get(this.ownerID)
    }
    get me() {
        return this.members.get(this._bot.user.id)
    }
    get shardID() {
        return (Number(BigInt(this.id)) >> 22) % this._bot._shardsReady
    }
}