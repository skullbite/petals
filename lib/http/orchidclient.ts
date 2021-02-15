import { HttpClient, middleware } from "@augu/orchid"

import * as fd from "form-data"
import type RawClient from "../client"

const API_URL = "https://discord.com/api/v8" 

let kek = new HttpClient()
class OrchidPetals extends HttpClient {
    headers
    constructor(bot: RawClient) {
        const headers = {
            "User-Agent": "DiscordBot (https://discord.gg/Kzm9C3NYvq, v1)",
            "Authorization": `Bot ${bot.token}`
        }
        super({
            baseUrl: API_URL,
            defaults: {
                headers: headers,
            }
        })
        this.headers = headers
        //this.use(middleware.forms())
    }
}

export default OrchidPetals