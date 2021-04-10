type EmbedOpts = {
    title?: string
    description?: string
    url?: string
    author?: {
        name: string
        url?: string
        icon_url?: string
    }
    thumbnail?: { url: string }
    image?: { url: string }
    color?: number
    timestamp?: Date
    fields?: { name: string, value: string, inline?: boolean }[]
    footer?: { text: string, icon_url?: string }
}
export default class Embed {
    private data
    constructor(opts?: { title?: string, description?: string, color?: number, timestamp?: Date, url?: string }) {
        if (!opts) opts = {}
        const { title, description, url, color, timestamp } = opts
        this.data = {
            title: title ?? "",
            description: description ?? "",
            author: {},
            url: url ?? "",
            color: color ?? undefined,
            timestamp: timestamp ?? undefined,
            thumbnail: {},
            image: {},
            fields: []
        }
    }
    get toJSON() {
        return this.data
    }
    set<K extends keyof EmbedOpts>(key: K, value: EmbedOpts[K]): this {
        this.data[key] = value
        return this
    }
    setURL(url: string): this {
        this.data.url = url
        return this
    }
    setColor(color: number): this {
        this.data.color = color
        return this
    }
    setTimestamp(timestamp: Date): this {
        this.data.timestamp = timestamp
        return this
    }
    setFooter(text: string, icon_url?: string): this {
        this.data.footer = { text: text, icon_url: icon_url }
        return this
    }
    setThumbnail(url: string): this {
        this.data.thumbnail = { url: url }
        return this
    }
    setImage(url: string): this {
        this.data.image = { url: url }
        return this
    }
    setAuthor(name: string, url?: string, icon_url?: string): this {
        this.data.author = { name: name, url: url, icon_url: icon_url }
        return this
    }
    addField(name: string, value: string, inline: boolean = false): this {
        this.data.fields.push({ name: name, value: value, inline: inline })
        return this
    }
}
