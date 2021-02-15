import { User } from "./user"

class GuildBan {
    reason?: string
    user: User
    constructor(data, bot) {
        this.reason = data.reason
        this.user = new User(data.user, bot)
    }
}

export default GuildBan