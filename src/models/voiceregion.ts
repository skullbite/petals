import Base from "./base"

export default class VoiceRegion extends Base {
    name: string
    vip: boolean
    optimal: boolean
    deprecated: boolean
    custom: boolean
    constructor(data, bot) {
        super(data.id, bot)
        const { name, vip, optimal, deprecated, custom } = data
        this.name = name
        this.vip = vip
        this.optimal = optimal
        this.deprecated = deprecated
        this.custom = custom
    }
}
