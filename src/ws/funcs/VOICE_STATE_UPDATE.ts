import VoiceState from "../../models/voicestate"
import PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    const vs = new VoiceState(data.d, ws.bot)
    if (ws.useShard()) ws.bot.emit("voice.state.edit", vs)
}