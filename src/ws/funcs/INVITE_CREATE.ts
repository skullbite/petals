import Invite from "../../models/invite"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const invite = new Invite(data.d, ws.bot), guild = ws.bot.guilds.get(data.d.guild_id), channel = guild.channels.get(data.d.channel_id)
    ws.bot.emit("invite.create", invite, channel, guild)
}