/* eslint-disable linebreak-style */
import Base from "./base"
import { User } from "./user"

class IntegrationApplication extends Base {
    name: string
    icon: string
    description: string
    summary: string
    bot?: User
    constructor(data, _bot) {
        super(data.id, _bot)
        const { name, icon, description, summary, bot } = data
        this.name = name
        this.icon = icon
        this.description = description
        this.summary = summary
        if (bot) this.bot = new User(bot, this._bot)
    }
}
export default class Integration extends Base {
    name: string
    type: string
    enabled: boolean
    syncing?: boolean
    roleID?: string
    enableEmoticons?: boolean
    expireBehavior?: 0|1
    expireGracePeriod?: number
    user?: User
    account: { id: string, name: string }
    syncedAt?: Date
    subscriberCount?: number
    revoked?: boolean
    application?: IntegrationApplication
    constructor(data, bot) {
        super(data.id, bot)
        const { 
            name, 
            type, 
            enabled,
            syncing,
            role_id,
            enable_emoticons,
            expire_behavior,
            expire_grace_period,
            user,
            account,
            synced_at,
            subscriber_count,
            revoked,
            application
        } = data
        this.name = name
        this.type = type
        this.enabled = enabled
        this.syncing = syncing
        this.roleID = role_id
        this.enableEmoticons = enable_emoticons
        this.expireBehavior = expire_behavior
        this.expireGracePeriod = expire_grace_period
        this.user = new User(user, this._bot)
        this.account = account
        this.syncedAt = synced_at
        this.subscriberCount = subscriber_count
        this.revoked = revoked
        this.application = new IntegrationApplication(application, this._bot)
    }
}

