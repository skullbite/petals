/* eslint-disable linebreak-style */
import { User } from "./user"

export default class GuildBan {
    reason?: string
    user: User
    constructor(data, bot) {
        this.reason = data.reason
        this.user = new User(data.user, bot)
    }
}