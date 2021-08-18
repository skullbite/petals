import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const message = ws.bot.messages.get(data.d.id)
    ws.bot.messages.delete(data.d.id) 
    ws.bot.emit("msg.delete", message) 
}