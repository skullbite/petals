import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const guild = ws.bot.guilds.get(data.d.guild_id)
    ws.bot.emit("guild.integrations.edit", guild)
}