import Pile from "../utils/pile"
import { permissionKeys } from "../models/permissions"
import CommandContext from "./context"
import { Member, User } from "../models/user"
import { GuildChannels } from "../models/channel"
import Role from "../models/role"
import { Options, SlashTemplate } from "../models/interactions/command"
import CommandClient from "./commandclient"
export type argumentTypes = string | number | boolean | Member | User | GuildChannels | Role
export type argument = {
    name: string
    type: "str" | "num" | "bool" |"member" | "user" | "channel" | "role"
    description?: string
    required?: boolean
    useRest?: boolean
}
export function slashSafeArgument(d: argument["type"]) {
    switch (d) {
    case "str": return "STRING"
    case "num": return "INTEGER"
    case "bool": return "BOOLEAN"
    case "user":
    case "member": return "USER"
    case "channel": return "CHANNEL"
    case "role": return "ROLE"
    }
}
type commandExec<T = CommandClient> = (ctx: CommandContext<T>) => void
export type checkExec<T = CommandClient> = (ctx: CommandContext<T>) => boolean | Promise<boolean>
interface CommandOptions {
    name: string,
    aliases?: string[]
    description?: string
    cooldown?: {
        bucketType: "guild"|"channel"|"user"
        time: number
    }
    slashOnly?: boolean
    guildOnly?: boolean
    hidden?: boolean
    nsfw?: boolean
}
export class Command<T = CommandClient> {
    name: string
    exec: commandExec<T>
    aliases?: string[]
    description?: string
    hidden?: boolean
    guildOnly?: boolean
    nsfw?: boolean
    checks?: checkExec<T>[]
    args?: argument[]
    path?: string
    category?: string
    parent?: string
    cooldown?: {
        bucketType: "guild"|"channel"|"user"
        time: number
    }
    slashOnly?: boolean
    botPerms?: permissionKeys[]
    memberPerms?: permissionKeys[]
    constructor(opts: CommandOptions) {
        const { name, aliases, description, cooldown, guildOnly, hidden, nsfw, slashOnly } = opts
        if (!opts) throw new Error("Command requires an object.")
        if (!opts.name || !opts.name.length) throw new Error("Command is missing a name.")
        this.name = name
        this.aliases = aliases ?? []
        this.description = description
        this.cooldown = cooldown
        this.guildOnly = guildOnly ?? false
        this.hidden = hidden ?? false
        this.nsfw = nsfw ?? false
        this.slashOnly = slashOnly ?? false
    }
    setExec(exec: commandExec<T>): this {
        this.exec = exec  
        return this 
    }
    setArgs(args: argument[]): this {
        this.args = args
        return this
    }
    setChecks(checks: checkExec<T>[]): this {
        this.checks = checks
        return this
    }
    setBotPerms(permissions: permissionKeys[]): this {
        this.botPerms = permissions
        return this
    }
    setMemberPerms(permissions: permissionKeys[]): this {
        this.memberPerms = permissions
        return this
    }
    convertToSlash(): SlashTemplate {
        if (!this.name.match(/^[\w-]{1,32}$/)[0]) throw new Error("Command name doesn't match discord query (^[\\w-]{1,32}$). Cannot Convert.")
        return {
            name: this.name,
            description: this.description ?? "No Description Provided.",
            options: (this.args ? this.args.map<Options>(a => { 
                if (!a.name.match(/^[\w-]{1,32}$/)[0]) throw new Error(`Argument name "${a.name}" doesn't match discord query (^[\\w-]{1,32}$). Cannot Convert.`)
                return { 
                    name: a.name, 
                    type: slashSafeArgument(a.type), 
                    description: a.description ?? "No Description Provided.", 
                    required: a.required ?? false 
                } 
            }) : [])
        }
    }
}

export class Group<T = CommandClient> extends Command {
    subcommands: Pile<string, Command<T>>
    extCooldowns: Pile<string, Pile<string, number>>
    constructor(opts: CommandOptions) {
        super(opts)
        this.subcommands = new Pile
        this.extCooldowns = new Pile
    }
    getSubcommand(q: string): Command<T> { 
        const cmd = this.subcommands.get(q) || Array.from(this.subcommands.values()).filter((command) => command.aliases && command.aliases.includes(q)) 
        return cmd instanceof Array ? cmd[0] : cmd
    }
    addSubcommand(cmd: Command<T>): this {
        const check = this.getSubcommand(cmd.name)
        if (check) throw new Error(`${this.name}: Subcommand name/alias has already been registed.`)
        if (!cmd.exec) throw new Error(`${this.name}: Subcommand is missing "exec" function.`)
        if (cmd.aliases) {
            if (new Set(cmd.aliases).size !== cmd.aliases.length) throw new Error(`${this.name}: Subcommand aliases already registered.`)
        }
        this.subcommands.set(cmd.name, cmd)
        if (cmd.cooldown) this.extCooldowns.set(cmd.name, new Pile)
        cmd.parent = this.name
        return this
    }
    convertToSlash(): SlashTemplate {
        if (!this.name.match(/^[\w-]{1,32}$/)[0]) throw new Error("Command name doesn't match discord query (^[\\w-]{1,32}$). Cannot Convert.")
        const 
            subs = Array.from(this.subcommands.values()),
            output: SlashTemplate = {
                name: this.name,
                description: this.description ?? "No Description Provided."
            },
            subOpts = subs.map(d => { 
                if (!d.name.match(/^[\w-]{1,32}$/)[0]) throw new Error(`Argument name "${d.name}" doesn't match discord query (^[\\w-]{1,32}$). Cannot Convert.`)
                return { 
                    type: "SUB_COMMAND", 
                    name: d.name, 
                    description: d.description ?? "No Description Provided.",
                    options: (d.args ? d.args.map<Options>(a => { 
                        if (!a.name.match(/^[\w-]{1,32}$/)[0]) throw new Error(`Argument name "${d.name}" doesn't match discord query (^[\\w-]{1,32}$). Cannot Convert.`)
                        return { 
                            name: a.name, 
                            type: slashSafeArgument(a.type), 
                            description: a.description ?? "No Description Provided.", 
                            required: a.required ?? false 
                        } }) : [])
                } })
        output.options = subOpts as any
        return output
    }
}

export type cmd<T = CommandClient> = Command<T> | Group<T>