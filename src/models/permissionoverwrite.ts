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
const permissionTypes = {
    role: 0,
    member: 1
}
type permissionKeys = keyof typeof overwritePermissions
export default class PermissionOverwrite {
    id: string
    type: number
    allow: string
    deny: string
    constructor(data: { id: string, type: 0|1|keyof typeof permissionTypes, allow: string|permissionKeys[], deny: string|permissionKeys[] }) {
        this.id = data.id
        const { type, allow, deny } = data
        this.type = typeof type === "number" ? type : permissionTypes[type]
        switch (typeof allow) {
        case "string":
            this.allow = allow
            break
        case "object":
            let allown = 0
            allow.map(n => allown |= overwritePermissions[n])
            this.allow = String(allown) 
        }
        switch (typeof deny) {
        case "string":
            this.deny = deny
            break
        case "object":
            let denyn = 0
            deny.map(n => denyn |= overwritePermissions[n])
            this.deny = String(denyn) 
        }
    }
    get toJSON() {
        return {
            id: this.id,
            type: this.type,
            allow: this.allow,
            deny: this.deny
        }
    }
}
