import Base from "./base"
import * as c from "./channel"
import { Member } from "./user"
import type RawClient from "../client"
import Role from "./role"
import Emoji from "./emoji"
import Pile from "../furpile"
import PetalsFile from "./file"
import PermissionOverwrite from "./permissionoverwrite"
import PetalsPermissions from "./permissions"

interface WidgetSettings {
    enabled: boolean
    channel_id: string
}
interface VanityData {
    code?: string
    uses: number
}

class PartialGuild extends Base {
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
}

class Guild extends PartialGuild {
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
    owner: Member
    splash?: string
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
            this.members.set(d.user.id, new Member(d, this._bot)) 
        })
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
        this.owner = this.members.get(owner_id)
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
    get channels(): Map<string, c.GuildChannels> {
        const retVal = new Map
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
    async repositionChannel(channelID: string, position: number) {
        await this._bot.http.editChannelPositions(this.id, channelID, position)
    }
    async fetchMember(userID: string) {
        return this._bot.http.getGuildMember(this.id, userID)
    }
    async fetchMembers(opts: { limit?: number, after?: string }) {
        return this._bot.http.listGuildMembers(this.id, opts)
    }
    async changeNick(nick: string) {
        await this._bot.http.editSelfNick(this.id, nick)
    }
    async fetchAllBans() {
        return this._bot.http.getGuildBans(this.id)
    }
    async fetchBan(userID: string) {
        return this._bot.http.getGuildBan(this.id, userID)
    }
    async unban(userID: string) {
        await this._bot.http.removeGuildBan(this.id, userID)
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
    async getWidget() {
        return this._bot.http.getGuildWidget(this.id)
    }

}

export { PartialGuild, Guild }