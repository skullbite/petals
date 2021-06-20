import { Member, User } from "../../models/user"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const guild = ws.bot.guilds.get(data.d.guild_id), member = new Member(data.d, ws.bot)
    if (ws.useShard(guild)) {
        if (ws.bot.opts.caching.members) guild.members.set(data.d.id, member)
        if (ws.bot.opts.caching.users) ws.bot.users.set(data.d.id, new User(data.d, ws.bot))
        ws.bot.emit(data.t.includes("ADD") ? "guild.member" : "guild.member.edit", member, guild)
    }
}