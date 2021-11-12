import * as c from "../../models/channel"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    let channel: c.GuildChannels
    const guild = ws.bot.guilds.get(data.d.guild_id)
    switch (data.d.type) {
    case 0: 
        channel = new c.TextChannel(data.d, ws.bot)
        if (ws.bot.opts.caching.channels) ws.bot.channels.set(data.d.id, channel)
        guild.channels.set(data.d.id, channel)
        break
    case 2:
        channel = new c.VoiceChannel(data.d, ws.bot)
        if (ws.bot.opts.caching.channels) ws.bot.channels.set(data.d.id, channel)
        guild.channels.set(data.d.id, channel)
        break
    case 4:
        channel = new c.ChannelCategory(data.d, ws.bot)
        if (ws.bot.opts.caching.channels) ws.bot.channels.set(data.d.id, channel)
        guild.channels.set(data.d.id, channel)
        break
    case 5:
        channel = new c.NewsChannel(data.d, ws.bot)
        if (ws.bot.opts.caching.channels) ws.bot.channels.set(data.d.id, channel)
        guild.channels.set(data.d.id, channel)
        break
    case 6:
        channel = new c.StoreChannel(data.d, ws.bot)
        if (ws.bot.opts.caching.channels) ws.bot.channels.set(data.d.id, channel)
        guild.channels.set(data.d.id, channel)
        break
    case 13:
        channel = new c.StageChannel(data.d, ws.bot)
        if (ws.bot.opts.caching.channels) ws.bot.channels.set(data.d.id, channel)
        guild.channels.set(data.d.id, channel)
    }
    ws.bot.emit(data.t.includes("CREATE") ? "channel.create" : "channel.edit", channel)

}