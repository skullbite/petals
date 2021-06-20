import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const guild = ws.bot.guilds.get(data.d.id)
    if (ws.useShard(guild)) {
        if (!data.d.unavailible) ws.bot.guilds.delete(data.d.id)
        ws.bot.emit("guild.delete", guild)
    }
}