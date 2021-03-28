const CDN_URL = "https://cdn.discordapp.com"
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
export function avatarURL(userID: string, discriminator: string, hash?: string): string {
    let endpoint: string
    if (!hash) endpoint = `/embed/avatars/${Number(discriminator) % 2}.png`
    else endpoint = `/avatars/${userID}/${hash}.png`
    return CDN_URL + endpoint
}
export function guildWidgetImage(guildID: string, style: "shield"|"banner1"|"banner2"|"banner3"|"banner4"): string {
    return `https://discord.com/api/v8/guilds/${guildID}/widget.png?style=${style}`
}
