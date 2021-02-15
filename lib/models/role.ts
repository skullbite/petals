import Base from "./base"
import RawClient from "../client"
import PetalsPermissions from "./permissions"

class Role extends Base {
    position: number
    permissions: PetalsPermissions
    name: string
    mentionable: boolean
    managed: boolean
    hoisted: boolean
    color: number
    guildID: string
    constructor(data, bot: RawClient) {
        super(data.id, bot)
        const { position, permissions, name, mentionable, managed, hoist, color, guild_id } = data
        this.position = position
        this.permissions = new PetalsPermissions(BigInt(permissions))
        this.name = name
        this.mentionable = mentionable
        this.managed = managed
        this.hoisted = hoist
        this.color = color
        this.guildID = guild_id
    }
    async edit(opts: {
        name?: string,
        color?: number,
        hoist?: boolean,
        mentionable?: boolean,
        permissions?: PetalsPermissions
    }) {
        return this._bot.http.editGuildRole(this.guildID, this.id, opts)
    }
    async delete() {
        return this._bot.http.deleteGuildRole(this.guildID, this.id)
    }
    
}

export default Role