type EmbedOpts = {
    title?: string,
    description?: string,
    url?: string,
    author?: {
        name: string,
        url?: string,
        icon_url?: string,
    },
    thumbnail?: { url: string },
    image?: { url: string },
    color?: number,
    timestamp?: Date,
    fields?: { name: string, value: string, inline?: boolean }[],
    footer?: { text: string, icon_url?: string }
}
class Embed {
    data: EmbedOpts
    constructor(opts = undefined) {
        if (!opts) opts = {}
        const { title, description, author, url, color, timestamp, fields, image, thumbnail } = opts
        this.data = {
            title,
            description,
            author,
            url,
            color,
            timestamp,
            thumbnail,
            image,
            fields: fields || []
        }
        
    }
    get toJSON() {
        return { embed: this.data }
    }
    set<K extends keyof EmbedOpts>(key: K, value: EmbedOpts[K]): this {
        this.data[key] = value
        return this
    }
    setTitle(title: string): this {
        this.data.title = title
        return this
    }
    setDescription(description: string): this {
        this.data.description = description
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
    addField(name: string, value: string, inline = false): this {
        this.data.fields.push({ name: name, value: value, inline: inline ? inline : false })
        return this
    }
}

export default Embed