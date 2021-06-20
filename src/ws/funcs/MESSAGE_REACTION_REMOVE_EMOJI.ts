import Emoji from "../../models/emoji"
import PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const parsedData = {
        channel: ws.bot.channels.get(data.d.channel_id),
        guild: ws.bot.guilds.get(data.d.guild_id),
        message: ws.bot.messages.get(data.d.message_id),
        emoji: data.d.emoji.id ? new Emoji(data.d.emoji, ws.bot) : data.d.name
    }
    ws.bot.emit("msg.react.remove.emoji", parsedData)
}