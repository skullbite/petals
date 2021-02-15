const overwritePermissions = {
    VIEW_CHANNEL: 0x00000400,
    MANAGE_WEBHOOKS: 0x20000000,
    CREATE_INSTANT_INVITE: 0x00000001,
    SEND_MESSAGES: 0x00000800,
    EMBED_LINKS: 0x00004000,
    ATTACH_FILES: 0x00008000,
    READ_MESSAGE_HISTORY: 0x00010000,
    MENTION_EVERYONE: 0x00020000,
    USE_EXTERNAL_EMOJIS: 0x00040000,
    SEND_TTS_MESSAGES: 0x00001000,
    PRIORITY_SPEAKER: 0x00000100,
    STREAM: 0x00000200,
    CONNECT: 0x00100000,
    SPEAK: 0x00200000,
    MUTE_MEMBERS: 0x00400000,
    DEAFEN_MEMBERS: 0x00800000,
    MOVE_MEMBERS: 0x01000000,
    USE_VAD: 0x02000000
}
type permissionKeys = keyof typeof overwritePermissions
class PermissionOverwrite<K = permissionKeys> {
    id: string
    type: string
    allow: string
    deny: string
    constructor(data: { id: string, type: number, allow: string|K[], deny: string|K[] }) {
        this.id = data.id
        const { type, allow, deny } = data
        this.type = !type ? "role" : "member"
        switch (typeof allow) {
            case "string":
                this.allow = allow
                break
            case "object":
                let allown = 0
                Object.keys(overwritePermissions).map(n => allown |= overwritePermissions[n])
                this.allow = String(allown) 
        }
        switch (typeof deny) {
            case "string":
                this.deny = deny
                break
            case "object":
                let denyn = 0
                Object.keys(overwritePermissions).map(n => denyn |= overwritePermissions[n])
                this.deny = String(deny) 
        }
    }
    get toJSON() {
        const d = JSON.parse(JSON.stringify(this))
        d.type = this.type === "roles" ? 0 : 1
        return d
    }
}

export default PermissionOverwrite