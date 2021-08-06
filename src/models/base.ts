import type RawClient from "../client"

export default abstract class Base {
    id: string
    createdAt: Date
    _bot: RawClient
    constructor(snowflake: string, bot: RawClient) {
        if (!snowflake) return
        this.id = snowflake
        this.createdAt = new Date(Math.floor(Number((BigInt(snowflake) / 4194304n) + 1420070400000n)))
        this._bot = bot
    }
}
