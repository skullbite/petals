import Role from "../../models/role"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const role = new Role(data.d.role, ws.bot), guild = ws.bot.guilds.get(data.d.guild_id)
    guild.roles.set(data.d.role.id, role)
    ws.bot.emit(data.t.includes("CREATE") ? "guild.role.create" : "guild.role.edit", role, guild)

}