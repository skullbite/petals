import PetalsWS from ".."
import { ThreadMember } from "../../models/user"

export default (ws: PetalsWS, data) => {
    let thread
    if (ws.bot.opts.caching.channels) { 
        thread = ws.bot.channels.get(data.d.id)
    }
    ws.bot.emit("thread.members.edit", data.d.members.map(d => new ThreadMember(d)), thread)
}