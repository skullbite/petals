import Base from "../base"

export interface SubsetPermissions {
    id: string,
    type: 1 | 2,
    permission: boolean
}

export default class CommandPermissions extends Base {
    applicationID: string
    fromID: string
    permissions: SubsetPermissions
    constructor(data, bot) {
        super(data.id, bot)
        const { application_id, guild_id, permissions } = data
        this.applicationID = application_id
        this.fromID = guild_id
        this.permissions = permissions
    }
    get from() {
        return this._bot.guilds.get(this.fromID)
    }
}