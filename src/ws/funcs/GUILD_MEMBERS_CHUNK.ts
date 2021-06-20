import { Member, User } from "../../models/user"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const guild = ws.bot.guilds.get(data.d.guild_id)
    if (ws.useShard(guild)) {
        data.d.members.map(d => {
            Object.assign(d, { guild_id: data.d.guild_id })
            const member = new Member(d, ws.bot)
            if (ws.bot.opts.caching.users) ws.bot.users.set(d.user.id, new User(d.user, ws.bot))
            if (member.id !== ws.bot.user.id) guild.members.set(d.user.id, member)
        })
        ws.bot.guilds.set(data.d.guild_id, guild)
    }
}