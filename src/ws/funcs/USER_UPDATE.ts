import { ClientUser, User } from "../../models/user"
import PetalsWS from ".."

export default (ws: PetalsWS, data) => {
    if (!ws.useShard()) return
    const user = data.d.id === ws.bot.user.id ? new ClientUser(data.d, ws.bot) : new User(data.d, ws.bot)
    if (user instanceof ClientUser) ws.bot.user = user
    ws.bot.emit("user.edit", user)
}