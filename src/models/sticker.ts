import Base from "./base"
import { User } from "./user"

const stickerTypes = {
        1: "STANDARD",
        2: "GUILD"
    },
    formatTypes = {
        1: "PNG",
        2: "APNG",
        3: "LOTTIE"
    }

export default class Sticker extends Base {
    packID?: string
    name: string
    description?: string
    tags: string
    type: string
    formatType: string
    availible: boolean
    fromID: string
    user?: User
    sortValue: number
    constructor(d, bot) {
        super(d.id, bot)
        const { pack_id, name, description, tags, type, format_type, availible, guild_id, user, sort_value } = d
        this.packID = pack_id
        this.name = name
        this.description = description
        this.tags = tags
        this.type = stickerTypes[type]
        this.formatType = formatTypes[format_type]
        this.availible = availible ?? true
        this.fromID = guild_id
        this.user = user ? new User(user, bot) : undefined
        this.sortValue = sort_value
    }
}

export class StickerPack extends Base {
    stickers: Sticker[]
    name: string
    skuID: string
    coverStickerID?: string
    description: string
    bannerAssetID: string
    constructor(d, bot) {
        super(d.id, bot)
        const { stickers, name, sku_id, cover_sticker_id, description, banner_asset_id } = d
        this.stickers = stickers.map(s => new Sticker(s, bot))
        this.name = name
        this.skuID = sku_id
        this.coverStickerID = cover_sticker_id
        this.description = description
        this.bannerAssetID = banner_asset_id
    }
}