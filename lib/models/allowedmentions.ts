class AllowedMentions {
    parse: "everyone"|"roles"|"users"[]
    users: string[]
    roles: string[]
    replied_user: boolean
    constructor({ parse, users, roles, replied_user }: { parse?: "everyone" | "roles" | "users"[], users?: string[], roles?: string[], replied_user?: boolean } = {}) {
        this.parse = parse ? parse : []
        this.users = users ? users : []
        this.roles = roles ? roles : []
        this.replied_user = replied_user ? replied_user : false
    }
    get toJSON() {
        return JSON.parse(JSON.stringify(this))
    }
}
export default AllowedMentions