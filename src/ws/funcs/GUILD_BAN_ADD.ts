import { User } from "../../models/user"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const guild = ws.bot.guilds.get(data.d.guild_id), user = new User(data.d.user, ws.bot)
    ws.bot.emit(data.t.includes("ADD") ? "guild.ban" : "guild.ban.remove", user, guild)
}