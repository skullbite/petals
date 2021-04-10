import Base from "./base"
import RawClient from "../client"
import PetalsPermissions from "./permissions"

export default class Role extends Base {
    position: number
    permissions: PetalsPermissions
    name: string
    mentionable: boolean
    managed: boolean
    hoisted: boolean
    color: number
    fromID: string
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
        this.fromID = guild_id
    }
    get from() {
        return this._bot.guilds.get(this.fromID)
    }
    async edit(opts: {
        name?: string,
        color?: number,
        hoist?: boolean,
        mentionable?: boolean,
        permissions?: PetalsPermissions
    }) {
        return this._bot.http.editGuildRole(this.fromID, this.id, opts)
    }
    async delete() {
        return this._bot.http.deleteGuildRole(this.fromID, this.id)
    }
    get ping() {
        return `<@&${this.id}>`
    }
}