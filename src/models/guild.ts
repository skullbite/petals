import Base from "./base"
import * as c from "./channel"
import { Member, User } from "./user"
import type RawClient from "../client"
import type { statusTypes } from "../client"
import Role from "./role"
import Emoji from "./emoji"
import Pile from "../utils/furpile"
import PetalsFile from "../utils/file"
import PermissionOverwrite from "./permissionoverwrite"
import PetalsPermissions from "./permissions"
import * as cdn from "../http/cdn"

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
    flags?: string[]
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
        this.flags = flags ? Object.keys(activityFlags).map(d => { if (flags & activityFlags[d]) return d }) : []
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
        return cdn.guildSplashURL(this.id, this.splash)
    }
    get iconURL() {
        return cdn.guildIconURL(this.id, this.icon)
    }
    get bannerURL() {
        return cdn.guildBannerURL(this.id, this.banner)
    }
}

export class Guild extends PartialGuild {
    description?: string
    region: string
    roles: Pile<string, Role>
    emojis: Pile<string, Emoji>
    members: Pile<string, Member>
    joinedAt: Date
    discoverySplash?: string
    updatesChannel?: c.GuildTextable
    systemChannel?: c.GuildTextable
    rulesChannel?: c.GuildTextable
    afkChannel?: c.VoiceChannel
    boosterCount: number
    mfaLevel: number
    ownerID: string
    splash?: string
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
        members.map(d => {
            Object.assign(d, { guild_id: this.id })
            this.members.set(d.user.id, new Member(d, bot))
        })
        this.presences = presences.map(d => new Prensence(d, this._bot))
        channels.map(d => {
            Object.assign(d, { guild_id: this.id })
            switch (d.type) {
            case 0:
                this._bot.channels.set(d.id, new c.TextChannel(d, this._bot))
                break
            case 2:
                this._bot.channels.set(d.id, new c.VoiceChannel(d, this._bot))
                break
            case 4:
                this._bot.channels.set(d.id, new c.ChannelCategory(d, this._bot))
                break
            case 5:
                this._bot.channels.set(d.id, new c.NewsChannel(d, this._bot))
                break
            case 6:
                this._bot.channels.set(d.id, new c.StoreChannel(d, this._bot))
                break
            }
        })
        this.joinedAt = new Date(joined_at)
        this.discoverySplash = discovery_splash
        this.updatesChannel = this.channels.get(public_updates_channel_id) as c.GuildTextable
        this.rulesChannel = this.channels.get(rules_channel_id) as c.GuildTextable
        this.systemChannel = this.channels.get(system_channel_id) as c.GuildTextable
        this.afkChannel = this.channels.get(afk_channel_id) as c.VoiceChannel
        this.boosterCount = premium_subscription_count
        this.mfaLevel = mfa_level
        this.ownerID = owner_id
        this.features = features
        this.splash = splash
        this.preferredLocale = preferred_locale
        this.memberCount = member_count
        this.banner = banner
        this.afkTimeout = afk_timeout
        this.unavailible = unavailible
        this.boostLevel = premium_tier
        this.large = large
    }
    get channels(): Pile<string, c.GuildChannels> {
        const retVal: Pile<string, c.GuildChannels> = new Pile
        for (const key of Array.from(this._bot.channels.keys())) {
            const channel = this._bot.channels.get(key)
            if (!(channel instanceof c.DMChannel) && (channel.guildID === this.id)) retVal.set(channel.id, channel)
        }
        return retVal
    }
    async edit(opts: {
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
        type?: 0|2|4|5|6,
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
        await this._bot.http.editSelfNick({ guildID: this.id, nick: nick ?? "", reason: reason ?? ""})
    }
    async fetchAllBans() {
        return this._bot.http.getGuildBans(this.id)
    }
    async fetchBan(userID: string) {
        return this._bot.http.getGuildBan(this.id, userID)
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
    async getIntegrations() {
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
