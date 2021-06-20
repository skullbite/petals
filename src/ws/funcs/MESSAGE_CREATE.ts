import { Message } from "../../models/message"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const message = new Message(data.d, ws.bot)
    if (message.author.bot || !ws.useShard(message.guild)) return
    ws.bot.emit("msg", message)
    if (ws.bot.opts.caching.messages) ws.bot.messages.set(message.id, message)
}