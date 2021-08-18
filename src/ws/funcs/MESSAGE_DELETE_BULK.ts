import type PetalsWS from ".."
import { GuildTextable } from "../../models/channel"

export default (ws: PetalsWS, data) => {
    const guild = ws.bot.guilds.get(data.d.guild_id)
    const messages = data.d.ids.map(i => {
        const cached = ws.bot.messages.get(i)
        ws.bot.messages.delete(i)
        return cached
    })
    const channel = ws.bot.channels.get(data.d.channel_id) as GuildTextable
    ws.bot.emit("message.delete.bulk", messages, channel, guild)
}