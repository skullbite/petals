import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const invite = data.d.code, guild = ws.bot.guilds.get(data.d.guild_id), channel = guild.channels.get(data.d.channel_id)
    ws.bot.emit("invite.delete", invite, channel, guild)
}