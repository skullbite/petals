import { Member } from "../../models/user"
import PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const parsedData: any = {
        userID: data.d.user_id,
        timestamp: data.d.timestamp,
        channel: ws.bot.channels.get(data.d.channel_id),
        guild: ws.bot.guilds.get(data.d.guild_id)
    }
    if (data.d.member) {
        const cachedMember = parsedData.guild.members.get(data.d.member.user.id)
        if (cachedMember) parsedData.member = cachedMember
        else {
            Object.assign(data.d.member, { guild_id: data.d.guild_id })
            parsedData.member = new Member(data.d.member, ws.bot)
        }
    }
    if (ws.useShard(parsedData.guild)) ws.bot.emit("typing", parsedData)
}