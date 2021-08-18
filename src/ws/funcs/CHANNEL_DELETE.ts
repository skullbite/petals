import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const guild = ws.bot.guilds.get(data.d.guild_id), channel = guild.channels.get(data.d.id)
    guild.channels.delete(data.d.id)
    if (guild) guild.channels.delete(data.d.id)
    ws.bot.emit("channel.delete", channel)
}