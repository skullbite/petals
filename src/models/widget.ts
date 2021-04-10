import Base from "./base"
import { PartialChannel } from "./channel"
import { WidgetUser } from "./user"

export default class Widget extends Base {
    name: string
    instantInvite: string
    channels: PartialChannel[]
    members: WidgetUser[]
    presenceCount: number
    constructor(data, bot) {
        super(data.id, bot)
        const { name, instant_invite, channels, members, presence_count } = data
        this.name = name
        this.instantInvite = instant_invite
        this.channels = channels.map(d => new PartialChannel(d, this._bot))
        this.members = members.map(d => new WidgetUser(d, this._bot))
        this.presenceCount = presence_count
    }
}