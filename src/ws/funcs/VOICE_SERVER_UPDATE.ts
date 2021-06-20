import PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const parsedData = {
        guild: ws.bot.guilds.get(data.d.guild_id),
        endpoint: data.d.endpoint,
        token: data.d.token
    }
    if (ws.useShard(parsedData.guild)) ws.bot.emit("voice.server.edit", parsedData)
}