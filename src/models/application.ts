import Base from "./base"
import { TeamMember, User } from "./user"

class Team extends Base {
    icon?: string
    members: TeamMember[]
    ownerID: string
    constructor(data, bot) {
        super(data.id, bot)
        const { icon, members, owner_user_id } = data
        this.icon = icon
        this.members = members.map(d => new TeamMember(d, bot))
        this.ownerID = owner_user_id
    }
}
export default class Application extends Base {
    name: string
    icon?: string
    description: string
    rpcOrigins?: string[]
    public: boolean
    requiresCodeGrant: boolean
    owner: User
    summary: string
    verifyKey: string
    team: Team
    guildID?: string
    primarySKUID?: string
    slug?: string
    coverImage?: string
    flags: number
    constructor(data, bot) {
        super(data.id, bot)
        const { 
            name, 
            icon, 
            description, 
            rpc_origins, 
            bot_public, 
            bot_require_code_grant,
            owner,
            summary,
            verify_key,
            team,
            guild_id,
            primary_sku_id,
            slug,
            cover_image,
            flags
        } = data
        this.name = name
        this.icon = icon
        this.description = description
        this.rpcOrigins = rpc_origins
        this.public = bot_public
        this.requiresCodeGrant = bot_require_code_grant
        this.owner = new User(owner, bot)
        this.summary = summary
        this.verifyKey = verify_key
        this.team = new Team(team, bot)
        this.guildID = guild_id
        this.primarySKUID = primary_sku_id
        this.slug = slug
        this.coverImage = cover_image
        this.flags = flags
    }
}