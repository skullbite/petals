import VoiceState, { ClientVoiceState, MinimalVoiceState } from "../../models/voicestate"
import PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const vs = new VoiceState(data.d, ws.bot)
    ws.bot.emit("voice.state.edit", vs)
    if (data.d.user_id === ws.bot.user.id) {
        ws.bot.guilds.get(data.d.guild_id).voiceState = data.d.channel_id ? new ClientVoiceState(data.d, ws.bot) : undefined
    }
    else { 
        const m = ws.bot.guilds.get(data.d.guild_id).members.get(data.d.user_id)
        m.voiceState = data.d.channel_id ? new MinimalVoiceState(data.d, ws.bot) : undefined 
        ws.bot.guilds.get(data.d.guild_id).members.set(m.id, m)
    }
}