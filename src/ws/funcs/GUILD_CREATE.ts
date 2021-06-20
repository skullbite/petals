import { Guild } from "../../models/guild"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const guild = new Guild(data.d, ws.bot)
    if (ws.useShard(guild)) { 
        ws.bot.guilds.set(data.d.id, guild)
        if (ws.bot.opts.requestAllMembers) ws.send(JSON.stringify({ op: 8, d: { guild_id: [data.d.id], query: "", limit: 0 } }))
        ws.bot.emit(data.t.includes("CREATE") ? "guild.new" : "guild.edit", guild) 
    }
}