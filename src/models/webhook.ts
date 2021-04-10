import { avatarURL } from "../http/cdn"
import Base from "./base"
import { User } from "./user"

const WHtypes = {
    1: "INCOMING",
    2: "CHANNEL_FOLLOWER"
}
export class Webhook extends Base {
    type: string
    fromID?: string
    channelID: string
    user?: User
    name: string
    avatar?: string
    applicationID?: string
    constructor(data, bot) {
        super(data.id, bot)
        const { type, guild_id, channel_id, user, name, avatar, application_id } = data
        this.type = WHtypes[type]
        this.fromID = guild_id
        this.channelID = channel_id
        this.user = new User(user, this._bot)
        this.name = name
        this.avatar = avatar
        this.applicationID = application_id
    }
    get from() {
        return this._bot.guilds.get(this.fromID)
    }
    get avatarURL() {
        return avatarURL(this.id, "0000", this.avatar)
    }
    
}