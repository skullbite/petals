import { Member, User } from "../../models/user"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const guild = ws.bot.guilds.get(data.d.guild_id)
    const member = new Member(data.d, ws.bot, guild) // why tf ain't the guild showing up sometimes.
    if (ws.bot.opts.caching.members) guild.members.set(data.d.id, member)
    if (ws.bot.opts.caching.users) ws.bot.users.set(data.d.id, new User(data.d.user, ws.bot))
    ws.bot.emit(data.t.includes("ADD") ? "guild.member" : "guild.member.edit", member, guild)
}