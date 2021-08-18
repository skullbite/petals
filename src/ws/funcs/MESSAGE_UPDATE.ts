import { Message } from "../../models/message"
import PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    if (!data.d.author) return
    const before = ws.bot.messages.get(data.d.id), after = new Message(data.d, ws.bot)
    if (ws.bot.opts.caching.messages) ws.bot.messages.set(data.d.id, after)
    ws.bot.emit("msg.edit", before, after) 
}