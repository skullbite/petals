import { ClientUser } from "../../models/user"
import PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    ws.bot.emit("shard.ready", ws.loginPayload.shards[0])
    if (!ws.bot.user) ws.bot.user = new ClientUser(data.d.user, ws.bot)
    if (ws.bot._shardsReady === ws.loginPayload.shards[1] || ws.bot._shardsReady === ws.bot.opts.shards?.length) {
        ws.bot.sessionID = data.d.session_id
        if (!ws.bot._allShardsReady) {
            ws.bot.emit("ready") 
            ws.bot._allShardsReady = true
        }
    }
}