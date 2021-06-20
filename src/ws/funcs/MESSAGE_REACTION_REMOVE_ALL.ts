import PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const parsedData = {
        channel: ws.bot.channels.get(data.d.channel_id),
        guild: ws.bot.guilds.get(data.d.guild_id),
        message: ws.bot.messages.get(data.d.message_id)
    }
    if (ws.useShard(parsedData.guild)) ws.bot.emit("msg.react.remove.all", parsedData)
}