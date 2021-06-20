import { GuildTextable } from "../../models/channel"
import PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const guild = ws.bot.guilds.get(data.d.guild_id), channel = guild.channels.get(data.d.channel_id) as GuildTextable
    if (ws.useShard(guild)) ws.bot.emit("webhooks.edit", channel, guild)
}