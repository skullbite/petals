import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const guild = ws.bot.guilds.get(data.d.guild_id), role = guild.roles.get(data.d.role_id)
    if (ws.useShard(guild)) {
        guild.roles.delete(data.d.role_id)
        ws.bot.emit("guild.role.delete", role, guild)
    }
}