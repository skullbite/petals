import Base from "./base"
import RawClient from "../client"

class Emoji extends Base {
    name: string
    animated: boolean
    availible: boolean
    guildID: string
    constructor(data, bot: RawClient) {
        super(data.id, bot)
        const { name, animated, availible, guildID } = data
        this.name = name
        this.animated = animated
        this.availible = availible
        this.guildID = guildID
    }

    get toString() {
        return `<${this.animated ? "a" : ""}:${this.name}:${this.id}>`
    }
    async edit(opts: { name?: string, roles?: string[] }) {
        return this._bot.http.editGuildEmoji(this.guildID, this.id, opts)
    }
    async delete() {
        await this._bot.http.deleteGuildEmoji(this.guildID, this.id)
    }
}

export default Emoji