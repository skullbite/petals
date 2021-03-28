import Base from "./base"
type mixed = string|{ name: string, id: string }[]|{ id: string, type: number, allow: string, deny: string }[]|boolean|number

export default class AuditLogEntry extends Base {
    targetID: string
    changes?: {
        oldValue?: mixed
        newValue?: mixed,
        key: string
    }[]
    userID: string
    action: string
    options?: string
    reason?: string
    constructor(data, bot) {
        super(data.id, bot)
        const { target_id, changes, user_id, action_type, options, reason } = data
        this.targetID = target_id
        this.changes = changes
        this.userID = user_id
        this.options = options
        this.reason = reason
        switch (action_type) {
        case 1:
            this.action = "GUILD_UPDATE"
            break
        case 10:
            this.action = "CHANNEL_CREATE"
            break
        case 11:
            this.action = "CHANNEL_UPDATE"
            break
        case 12:
            this.action = "CHANNEL_DELETE"
            break
        case 13:
            this.action = "CHANNEL_OVERWRITE_CREATE"
            break
        case 14:
            this.action = "CHANNEL_OVERWRITE_UPDATE"
            break
        case 15:
            this.action = "CHANNEL_OVERWRITE_DELETE"
            break
        case 20:
            this.action = "MEMBER_KICK"
            break
        case 21:
            this.action = "MEMBER_PRUNE"
            break
        case 22:
            this.action = "MEMBER_BAN_ADD"
            break
        case 23:
            this.action = "MEMBER_BAN_REMOVE"
            break
        case 24:
            this.action = "MEMBER_UPDATE"
            break
        case 25:
            this.action = "MEMBER_ROLE_UPDATE"
            break
        case 26:
            this.action = "MEMBER_MOVE"
            break
        case 27:
            this.action = "MEMBER_DISCONNECT"
            break
        case 28:
            this.action = "BOT_ADD"
            break
        case 30:
            this.action = "ROLE_CREATE"
            break
        case 31:
            this.action = "ROLE_UPDATE"
            break
        case 32:
            this.action = "ROLE_DELETE"
            break
        case 40:
            this.action = "INVITE_CREATE"
            break
        case 41:
            this.action = "INVITE_UPDATE"
            break
        case 42:
            this.action = "INVITE_DELETE"
            break
        case 50:
            this.action = "WEBHOOK_CREATE"
            break
        case 51:
            this.action = "WEBHOOK_UPDATE"
            break
        case 52:
            this.action = "WEBHOOK_DELETE"
            break
        case 60:
            this.action = "EMOJI_CREATE"
            break
        case 61:
            this.action = "EMOJI_UPDATE"
            break
        case 62:
            this.action = "EMOJI_DELETE"
            break
        case 72:
            this.action = "MESSAGE_DELETE"
            break
        case 73:
            this.action = "MESSAGE_BULK_DELETE"
            break
        case 74:
            this.action = "MESSAGE_PIN"
            break
        case 75:
            this.action = "MESSAGE_UNPIN"
            break
        case 80:
            this.action = "INTEGRATION_CREATE"
            break
        case 81:
            this.action = "INTEGRATION_UPDATE"
            break
        case 82:
            this.action = "INTEGRATION_DELETE"
            break
        }
    }
}
