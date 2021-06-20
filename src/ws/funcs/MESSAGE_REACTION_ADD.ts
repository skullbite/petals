import Emoji from "../../models/emoji"
import { Member } from "../../models/user"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const parsedData: any = {
        message: ws.bot.messages.get(data.d.message_id),
        userID: data.d.user_id,
        emoji: data.d.emoji.id ? new Emoji(data.d.emoji, ws.bot) : data.d.emoji.name,
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
    const confirmShard = ws.useShard(parsedData.guild)
    if (confirmShard) ws.bot.emit(data.t.includes("ADD") ? "msg.react" : "msg.react.remove", parsedData)

}