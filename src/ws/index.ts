/* eslint-disable no-fallthrough */
import * as ws from "ws"
import type RawClient from "../client"
import { WS_URI } from "../utils/constants"
import CHANNEL_CREATE from "./funcs/CHANNEL_CREATE"
import CHANNEL_DELETE from "./funcs/CHANNEL_DELETE"
import CHANNEL_PINS_UPDATE from "./funcs/CHANNEL_PINS_UPDATE"
import GUILD_BAN_ADD from "./funcs/GUILD_BAN_ADD"
import GUILD_CREATE from "./funcs/GUILD_CREATE"
import GUILD_DELETE from "./funcs/GUILD_DELETE"
import GUILD_EMOJIS_UPDATE from "./funcs/GUILD_EMOJIS_UPDATE"
import GUILD_INTEGRATIONS_UPDATE from "./funcs/GUILD_INTEGRATIONS_UPDATE"
import GUILD_MEMBERS_CHUNK from "./funcs/GUILD_MEMBERS_CHUNK"
import GUILD_MEMBER_ADD from "./funcs/GUILD_MEMBER_ADD"
import GUILD_MEMBER_REMOVE from "./funcs/GUILD_MEMBER_REMOVE"
import GUILD_ROLE_CREATE from "./funcs/GUILD_ROLE_CREATE"
import GUILD_ROLE_DELETE from "./funcs/GUILD_ROLE_DELETE"
import INTERACTION_CREATE from "./funcs/INTERACTION_CREATE"
import INVITE_CREATE from "./funcs/INVITE_CREATE"
import INVITE_DELETE from "./funcs/INVITE_DELETE"
import MESSAGE_CREATE from "./funcs/MESSAGE_CREATE"
import MESSAGE_DELETE from "./funcs/MESSAGE_DELETE"
import MESSAGE_DELETE_BULK from "./funcs/MESSAGE_DELETE_BULK"
import MESSAGE_REACTION_ADD from "./funcs/MESSAGE_REACTION_ADD"
import MESSAGE_REACTION_REMOVE_ALL from "./funcs/MESSAGE_REACTION_REMOVE_ALL"
import MESSAGE_REACTION_REMOVE_EMOJI from "./funcs/MESSAGE_REACTION_REMOVE_EMOJI"
import MESSAGE_UPDATE from "./funcs/MESSAGE_UPDATE"
import READY from "./funcs/READY"
import TYPING_START from "./funcs/TYPING_START"
import USER_UPDATE from "./funcs/USER_UPDATE"
import VOICE_SERVER_UPDATE from "./funcs/VOICE_SERVER_UPDATE"
import VOICE_STATE_UPDATE from "./funcs/VOICE_STATE_UPDATE"
import WEBHOOKS_UPDATE from "./funcs/WEBHOOKS_UPDATE"

export default class PetalsWS extends ws {
    readonly bot: RawClient
    loginPayload: {
        token: string
        shards: [number, number]
        properties: {
            $os: string
            $browser: string
            $device: string
        }
        intents: number
        large_threshold: number
        guild_subscriptions: boolean
    }
    constructor(bot: RawClient, shardID: number, totalShards: number) {
        super(WS_URI)
        this.bot = bot
        this.loginPayload = {
            token: this.bot.token,
            shards: [shardID, totalShards],
            properties: {
                $os: process.platform,
                $browser: "Cutie Flowers",
                $device: "Petals"
            },
            intents: this.bot.intents,
            large_threshold: this.bot.opts.largeThreshold,
            guild_subscriptions: this.bot.opts.subscriptions
        }
        this.on("close", (d: number) => {
            switch (d) {
            case 4001: throw new Error("Invalid opcode! This isn't supposed to happen.")
            case 4004: 
                console.error(new Error("Invalid token provided! Cannot login."))
                process.exit()
            case 4002: throw new Error("Invalid payload sent! This isn't supposed to happen.")
            case 4003: 
                console.error(new Error("Payload sent before identification!"))
                process.exit()
            case 4005: 
                console.error(new Error("Multiple indentifications have been sent!"))
                process.exit()
            case 4010: 
                console.error(new Error("An invalid shard was sent while identifying!"))
                process.exit()
            case 4011:
                console.error(new Error("Discord is now requiring you to shard."))
                process.exit()
            case 4013: 
                console.error(new Error("Invalid intents sent!"))
                process.exit()
            case 4014: 
                console.error(new Error("Disallowed intents provided! Are you whitelisted for ALL intents specified?"))
                process.exit()
            case 1006: 
                this.bot.emit("error", new Error("Connection reset."))
                this.bot._allShardsReady = false
                if (this.bot.opts.reconnect) this.bot.shards.get(this.loginPayload.shards[0]).restart()
                else if (this.bot._shardsReady === 0) process.exit()
                break
            case 3333: 
                this.bot._allShardsReady = false
                break
            default: 
                this.bot.emit("error", new Error(`${d}: Session Closed`))
                this.bot._allShardsReady = false
                if (this.bot.opts.reconnect) this.bot.shards.get(this.loginPayload.shards[0]).restart()
                else if (this.bot._shardsReady === 0) process.exit()
                break
            }
        })
        this.on("message", async (d: string): Promise<void> => {
            const data: {
                op: number
                d: { [x: string]: any }
                s?: number
                t?: string
            } = JSON.parse(d)
            switch (data.op) {
            case 0:
                this.bot.lastSeq = data.s
                if (!data.d.guild_id) {
                    if (this.loginPayload.shards[0] !== 0) return
                }
                else if (Number((BigInt(data.d.guild_id) >> 22n) % BigInt(this.bot.opts.shardCount)) !== this.loginPayload.shards[0]) return
                switch (data.t) {
                case "READY": READY(this, data)
                    break
                case "USER_UPDATE": USER_UPDATE(this, data)
                    break
                case "MESSAGE_CREATE": MESSAGE_CREATE(this, data)
                    break
                case "MESSAGE_DELETE": MESSAGE_DELETE(this, data)
                    break
                case "MESSAGE_DELETE_BULK": MESSAGE_DELETE_BULK(this, data)
                    break
                case "MESSAGE_UPDATE": MESSAGE_UPDATE(this, data)
                    break
                case "MESSAGE_REACTION_REMOVE":
                case "MESSAGE_REACTION_ADD": MESSAGE_REACTION_ADD(this, data)
                    break
                case "MESSAGE_REACTION_REMOVE_ALL": MESSAGE_REACTION_REMOVE_ALL(this, data)
                    break
                case "MESSAGE_REACTION_REMOVE_EMOJI": MESSAGE_REACTION_REMOVE_EMOJI(this, data)
                    break
                case "TYPING_START": TYPING_START(this, data)
                    break
                case "WEBHOOKS_UPDATE": WEBHOOKS_UPDATE(this, data)
                    break
                case "GUILD_UPDATE":
                case "GUILD_CREATE": GUILD_CREATE(this, data)
                    break
                case "GUILD_MEMBERS_CHUNK": GUILD_MEMBERS_CHUNK(this, data)
                    break 
                case "GUILD_DELETE": GUILD_DELETE(this, data)
                    break
                case "GUILD_INTEGRATIONS_UPDATE": GUILD_INTEGRATIONS_UPDATE(this, data)
                    break
                case "GUILD_EMOJIS_UPDATE": GUILD_EMOJIS_UPDATE(this, data)
                    break
                case "CHANNEL_UPDATE":
                case "CHANNEL_CREATE": CHANNEL_CREATE(this, data)
                    break
                case "CHANNEL_DELETE": CHANNEL_DELETE(this, data)
                    break
                case "CHANNEL_PINS_UPDATE": CHANNEL_PINS_UPDATE(this, data)
                    break
                case "GUILD_ROLE_CREATE":
                case "GUILD_ROLE_UPDATE": GUILD_ROLE_CREATE(this, data)
                    break
                case "GUILD_ROLE_DELETE": GUILD_ROLE_DELETE(this, data)
                    break
                case "INVITE_CREATE": INVITE_CREATE(this, data)
                    break
                case "INVITE_DELETE": INVITE_DELETE(this, data)
                    break
                case "GUILD_MEMBER_ADD":
                case "GUILD_MEMBER_UPDATE": GUILD_MEMBER_ADD(this, data)
                    break
                case "GUILD_MEMBER_REMOVE": GUILD_MEMBER_REMOVE(this, data)
                    break
                case "GUILD_BAN_ADD":
                case "GUILD_BAN_REMOVE": GUILD_BAN_ADD(this, data)
                    break
                case "VOICE_STATE_UPDATE": VOICE_STATE_UPDATE(this, data)
                    break
                case "VOICE_SERVER_UPDATE": VOICE_SERVER_UPDATE(this, data)
                    break
                case "INTERACTION_CREATE": INTERACTION_CREATE(this, data)
                    break
                }
                break
            case 1: this.bot.emit("ack", this.loginPayload.shards[0])
                break
            case 7: this.bot.emit("resume")
                break
            case 9: if (data.d) this.send(JSON.stringify({ op: 6, token: this.bot.token, session_id: this.bot.sessionID, seq: this.bot.lastSeq }))
                break
            case 10:
                this.send(JSON.stringify({ op: 2, d: this.loginPayload }))
                this.bot.heartbeatInterval = data.d.heartbeat_interval
                setInterval(() => this.send(JSON.stringify({ op: 1, d: this.bot.lastSeq })), this.bot.heartbeatInterval)
                break
            case 11: break
            }
        })
    }
    get latency() {
        let ping = Date.now()
        this.bot.once("ack", () => ping = ping - Date.now())
        return ping
    }
}
