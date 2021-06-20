import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const guild = ws.bot.guilds.get(data.d.guild_id), channel = guild.channels.get(data.d.id)
    if (ws.useShard(guild)) ws.bot.emit("channel.pins.edit", new Date(data.d.last_pin_timestamp), channel, guild ?? null)
}