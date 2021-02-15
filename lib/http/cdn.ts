const CDN_URL = "https://cdn.discordapp.com"
function emojiURL(emojiID: string): string {
    return CDN_URL + `/emojis/${emojiID}.${emojiID.startsWith("a_") ? "gif" : "png"}`
}
function guildIconURL(guildID: string, hash: string): string {
    return CDN_URL + `/splashes/${guildID}/${hash}.${hash.startsWith("a_") ? "gif" : "png"}`
}
function guildSplashURL(guildID: string, hash: string): string {
    return CDN_URL + `/discovery-splashes/${guildID}/${hash}.png`
}
function guildBannerURL(guildID: string, hash: string): string {
    return CDN_URL + `/banners/${guildID}/${hash}.png`
}
function avatarURL(userID: string, discriminator: string, hash?: string): string {
    let endpoint: string
    if (!hash) endpoint = `/embed/avatars/${Number(discriminator) % 2}.png`
    else endpoint = `/avatars/${userID}/${hash}.png`
    return CDN_URL + endpoint
}

export { emojiURL, guildIconURL, guildSplashURL, guildBannerURL, avatarURL }