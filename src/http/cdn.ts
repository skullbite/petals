import { CDN_URL, API_URL } from "../utils/constants"

export function emojiURL(emojiID: string): string {
    return CDN_URL + `/emojis/${emojiID}.${emojiID.startsWith("a_") ? "gif" : "png"}`
}
export function guildIconURL(guildID: string, hash: string): string {
    return CDN_URL + `/icons/${guildID}/${hash}.${hash.startsWith("a_") ? "gif" : "png"}`
}
export function guildSplashURL(guildID: string, hash: string): string {
    return CDN_URL + `/discovery-splashes/${guildID}/${hash}.png`
}
export function guildBannerURL(guildID: string, hash: string): string {
    return CDN_URL + `/banners/${guildID}/${hash}.png`
}
export function avatarURL(userID: string, discriminator?: string, hash?: string, format?: string, size?: number): string {
    let endpoint: string
    if (!hash) endpoint = `/embed/avatars/${Number(discriminator) % 2}.png${size ? "?size="+String(size) : ""}`
    else endpoint = `/avatars/${userID}/${hash}.${format ?? "png"}${size ? "?size="+String(size) : ""}`
    return CDN_URL + endpoint
}
export function guildWidgetImage(guildID: string, style: "shield"|"banner1"|"banner2"|"banner3"|"banner4"): string {
    return API_URL + `/guilds/${guildID}/widget.png?style=${style}`
}
