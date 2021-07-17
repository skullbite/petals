import Interaction, { ButtonInteraction, SelectInteraction } from "../../models/interactions/interaction"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    if (data.d.type === 2) ws.bot.emit("slash", new Interaction(data.d, ws.bot))
    if (data.d.type === 3) { 
        if (data.d.data.component_type === 2) ws.bot.emit("click", new ButtonInteraction(data.d, ws.bot)) 
        if (data.d.data.component_type === 3) ws.bot.emit("select", new SelectInteraction(data.d, ws.bot))
    }
}