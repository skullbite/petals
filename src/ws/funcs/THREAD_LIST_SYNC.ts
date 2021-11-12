import PetalsWS from ".."
import { ThreadChannel } from "../../models/channel"
import { ThreadMember } from "../../models/user"

export default (ws: PetalsWS, data) => {
    const 
        guild = ws.bot.guilds.get(data.d.guild_id),
        channelIDs = data.d.channel_ids,
        threads = data.d.threads.map(d => new ThreadChannel(d, ws.bot)),
        members = data.d.members.map(d => new ThreadMember(d))
    // ???
    // i'll come back to this later

}