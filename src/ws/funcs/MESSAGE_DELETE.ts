import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const message = ws.bot.messages.get(data.d.id)
    if (ws.useShard(message?.guild ?? ws.bot.guilds.get(data.d.guild_id))) {
        ws.bot.messages.delete(data.d.id) 
        ws.bot.emit("msg.delete", message) 
    }
}