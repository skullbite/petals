import Emoji from "../../models/emoji"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const guild = ws.bot.guilds.get(data.d.guild_id), emojis = data.d.emojis.map(d => new Emoji(d, ws.bot))
    if (ws.useShard(guild)) {
        emojis.map(d => guild.emojis.set(d.id, d))
        ws.bot.emit("guild.emojis.edit", guild, emojis)
    }
}