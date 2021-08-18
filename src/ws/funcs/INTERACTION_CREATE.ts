import Interaction, { ButtonInteraction, MessageInteraction, SelectInteraction, UserInteraction } from "../../models/interactions/interaction"
import type PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    if (data.d.type === 2) { 
        if (!data.d.data.type) ws.bot.emit("slash", new Interaction(data.d, ws.bot))
        else if (data.d.data.type === 2) ws.bot.emit("user.cmd", new UserInteraction(data.d, ws.bot)) 
        else if (data.d.data.type === 3) ws.bot.emit("msg.cmd", new MessageInteraction(data.d, ws.bot)) 
    }
    if (data.d.type === 3) { 
        if (data.d.data.component_type === 2) ws.bot.emit("click", new ButtonInteraction(data.d, ws.bot)) 
        if (data.d.data.component_type === 3) ws.bot.emit("select", new SelectInteraction(data.d, ws.bot))
    }
}