import Pile from "../utils/furpile"
import { permissionKeys } from "../models/permissions"
import CommandContext from "./context"
import { Member, User } from "../models/user"
import { GuildChannels } from "../models/channel"
import Role from "../models/role"
export type argumentTypes = string | number | Member | User | GuildChannels | Role
export type argument = {
    name: string
    type: "str" | "num" | "member" | "user" | "channel" | "role"
    required?: boolean
    useRest?: boolean
}
type commandExec = (ctx: CommandContext) => void
export type checkExec = (ctx: CommandContext) => boolean
interface commandOptions {
    name: string,
    aliases?: string[]
    description?: string
    cooldown?: number
    guildOnly?: boolean
    hidden?: boolean
    nsfw?: boolean
}

export class Command {
    name: string
    exec: commandExec
    aliases?: string[]
    description?: string
    hidden?: boolean
    guildOnly?: boolean
    nsfw?: boolean
    checks?: checkExec[]
    args?: argument[]
    path?: string
    category?: string
    parent?: string
    cooldown?: number;
    botPerms?: permissionKeys[]
    memberPerms?: permissionKeys[]
    constructor(opts: commandOptions) {
        const { name, aliases, description, cooldown, guildOnly, hidden, nsfw } = opts
        if (!opts) throw new Error("Command requires an object.")
        if (!opts.name || !opts.name.length) throw new Error("Command is missing a name.")
        this.name = name
        this.aliases = aliases ?? []
        this.description = description
        this.cooldown = cooldown
        this.guildOnly = guildOnly ?? false
        this.hidden = hidden ?? false
        this.nsfw = nsfw ?? false
    }
    setExec(exec: commandExec): this {
        this.exec = exec  
        return this 
    }
    setArgs(args: argument[]): this {
        this.args = args
        return this
    }
    setChecks(checks: checkExec[]): this {
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
}

export class Group extends Command {
    subcommands: Pile<string, Command>
    extCooldowns: Pile<string, Pile<string, number>>
    constructor(opts: commandOptions) {
        super(opts)
        this.subcommands = new Pile
        this.extCooldowns = new Pile
    }
    getSubcommand(q: string): cmd { 
        const cmd = this.subcommands.get(q) || Array.from(this.subcommands.values()).filter((command) => command.aliases && command.aliases.includes(q)) 
        return cmd instanceof Array ? cmd[0] : cmd
    }
    addSubcommand(cmd: Command): this {
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
}

export type cmd = Command | Group