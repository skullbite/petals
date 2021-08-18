import { User } from "../../models/user"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const guild = ws.bot.guilds.get(data.d.guild_id), user = new User(data.d.user, ws.bot)
    if (guild) guild.members.delete(data.d.id)
    ws.bot.emit("guild.member.leave", user, guild)
}