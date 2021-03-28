export const guildPermissions = {
    ADMINISTRATOR: 0x00000008,
    MANAGE_ROLES: 0x10000000,
    MANAGE_WEBHOOKS: 0x20000000,
    MANAGE_EMOJIS: 0x40000000,
    MANAGE_GUILD: 0x00000020,
    MANAGE_CHANNELS: 0x00000010,
    KICK_MEMBERS: 0x00000002,
    BAN_MEMBERS: 0x00000004,
    MANAGE_NICKNAMES: 0x08000000,
    MANAGE_MESSAGES: 0x00002000,
    CREATE_INSTANT_INVITE: 0x00000001,
    ADD_REACTIONS: 0x00000040,
    VIEW_AUDIT_LOG: 0x00000080,
    PRIORITY_SPEAKER: 0x00000100,
    STREAM: 0x00000200,
    VIEW_CHANNEL: 0x00000400,
    SEND_MESSAGES: 0x00000800,
    SEND_TTS_MESSAGES: 0x00001000,
    EMBED_LINKS: 0x00004000,
    ATTACH_FILES: 0x00008000,
    READ_MESSAGE_HISTORY: 0x00010000,
    MENTION_EVERYONE: 0x00020000,
    USE_EXTERNAL_EMOJIS: 0x00040000,
    VIEW_GUILD_INSIGHTS: 0x00080000,
    CONNECT: 0x00100000,
    SPEAK: 0x00200000,
    MUTE_MEMBERS: 0x00400000,
    DEAFEN_MEMBERS: 0x00800000,
    MOVE_MEMBERS: 0x01000000,
    USE_VAD: 0x02000000,
    CHANGE_NICKNAME: 0x04000000
}
export type permissionKeys = (keyof typeof guildPermissions)
export default class PetalsPermissions {
    bitset: bigint
    constructor(perms: bigint|permissionKeys[]) {
        switch (typeof perms) {
        case "bigint":
            this.bitset = perms
            break
        case "object":
            let n = 0
            perms.map(p => n |= guildPermissions[p])
            this.bitset = BigInt(n)
            break
        }
    }
    has(perm: permissionKeys) {
        return Boolean(this.bitset & BigInt(guildPermissions[perm]))
    }
    get toString() {
        return String(this.bitset)
    }
    get toJSON() {
        const d = {}
        Object.keys(guildPermissions).forEach(gp => d[gp] = Boolean(this.bitset & BigInt(guildPermissions[gp])))
        return d
    }
}