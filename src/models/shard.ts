import RawClient from "../client"
import PetalsWS from "../ws"

export default class Shard {
    id: number
    ws: PetalsWS
    bot: RawClient
    constructor(id: number, ws: PetalsWS, bot: RawClient) {
        this.id = id
        this.ws = ws
        this.bot = bot
    }
    restart() {
        this.ws.close(3333)
        this.bot._shardsReady--
        this.bot.shards.delete(this.id)
        this.ws = new PetalsWS(this.bot, this.id, this.bot.opts.shardCount as number)
        this.bot.shards.set(this.id, this)
        this.bot._shardsReady++
    }
    close() {
        this.ws.close(3333)
        this.bot._shardsReady--
        this.bot.shards.delete(this.id)
    }
    get latency() {
        return this.ws.latency
    }
}