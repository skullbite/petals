import PetalsWS from ".."
import { ThreadChannel } from "../../models/channel"

export default (ws: PetalsWS, data) => { 
    const thread = new ThreadChannel(data.d, ws.bot)
    if (ws.bot.opts.caching.messages) { 
        const m = ws.bot.messages.get(thread.parentID) 
        m.thread = thread
        ws.bot.messages.set(thread.parentID, m)
    }
    if (ws.bot.opts.caching.channels) ws.bot.channels.set(thread.id, thread)
    ws.bot.emit(`thread.${data.t.includes("CREATE") ? "create" : "edit"}`, thread) 
}