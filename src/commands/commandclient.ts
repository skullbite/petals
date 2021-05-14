import RawClient, { ClientEvents, ClientOptions } from "../client"
import Pile from "../utils/pile"
import { Message } from "../models/message"
import { guildPermissions } from "../models/permissions"
import { Member } from "../models/user"
import Category from "./category"
import { argument, argumentTypes, checkExec, cmd, Command, Group } from "./command"
import CommandContext from "./context"
import * as Converters from "./converter"
import * as Errors from "./errors"
import { escapeRegex } from "./index"
import Interaction from "../models/slash/interaction"

interface CommandOptions {
    prefix: string | string[] | ((m: Message) => string | string[] | (() => string | string[]))
    /** @deprecated Currently does not work. */
    usePrefixSpaces?: boolean
    ownerID?: string | string[]
    useRESTFetching?: boolean
    listenForSlash?: boolean
    syncWithSlash?: boolean
}

interface CommandEvents<T> extends ClientEvents<T> {
    (event: "cmd"|"cmd.before", listener: (ctx: CommandContext) => void): T
    (event: "cmd.after", listener: (ctx: CommandContext, timer: number) => void): T
    (event: "cmd.error", listener: (ctx: CommandContext, error: Errors.ErrorTypes) => void): T
    (event: "cmd.cooldown", listener: (ctx: CommandContext, left: number) => void): T
}

type cooldown = Pile<string, Pile<string, number>>
interface Cooldowns {
    users: cooldown
    guilds: cooldown
    channels: cooldown
}
export default class CommandClient extends RawClient {
    commands: Pile<string, cmd>
    categories: Pile<string, Category>
    cooldowns: Cooldowns
    commandOptions: CommandOptions
    declare on: CommandEvents<this>
    constructor(CommandOptions: CommandOptions, ClientOptions: ClientOptions) {
        super(ClientOptions)
        this.commands = new Pile
        this.categories = new Pile
        this.cooldowns = {
            users: new Pile,
            guilds: new Pile,
            channels: new Pile
        }
        this.commandOptions = Object.assign({
            usePrefixSpaces: false,
            useRESTFetching: true,
            listenForSlash: false,
            syncWithSlash: false
        }, CommandOptions)
        if (!this.commandOptions.prefix || this.commandOptions.prefix === [] || this.commandOptions.prefix === "") throw new Error("Empty Prefix Caught.")
        if (this.commandOptions.prefix === "/" || (this.commandOptions.prefix as string[]).includes("/")) console.warn("\x1b[33mWARNING: Things could get hairy when using '/' as a prefix. Proceed with caution.\x1b[0m")
        this.once("ready", () => {
            if (!this.getCommand("help")) this.addCommand(this.defaultHelp)
            if (!this.listenerCount("msg")) this.on("msg", async (m) => await this.processCommands(m))
            if (!this.listenerCount("slash") && this.commandOptions.listenForSlash) this.on("slash", async (i) => await this.processCommands(i))
            if (this.commandOptions.syncWithSlash) {
                if (this.commands.size > 100) throw new Error("To sync slash commands with yours, you can only have up to 100 commands registered.")
                const cmds = []
                Array.from(this.commands.values()).map(d => {
                    cmds.push(d.convertToSlash())
                })
                this.massSetGlobalCommands(cmds)
            }
            typeof this.commandOptions.prefix === "function" &&
                (this.commandOptions.prefix.length === 0 || this.commandOptions.prefix.length === 1)
                ? this.commandOptions.prefix = this.commandOptions.prefix.bind(this)() : {}
            const pre = this.commandOptions.prefix
            switch (typeof pre) {
            case "string":
                this.commandOptions.prefix = escapeRegex(pre)
                break
            case "object":
                this.commandOptions.prefix = pre.map(p => escapeRegex(p))
                break
            default:
                break
            }
        })
    }
    getHelp(ctx: CommandContext, command?: Command) {
        const
            argList = [],
            cmd: cmd = command ? command : ctx.invokedSubcommand ? ctx.invokedSubcommand : ctx.command, 
            parentCmd: cmd = cmd.parent ? this.getCommand(cmd.parent) : undefined, 
            parentStr: string = parentCmd ? parentCmd.aliases.length ? `[${parentCmd.name}|${parentCmd.aliases.join("|")} ` : parentCmd.name + " " :  "",
            usage = cmd.aliases.length ? ctx.prefix + `${parentStr}[${cmd.name}|${cmd.aliases.join("|")}]` : ctx.prefix + parentStr + cmd.name
        if (!cmd.args) return usage
        cmd.args.map((a: argument) => {
            a.required ? argList.push(`<${a.name}>`) : argList.push(`[${a.name}]`)
        })
        return usage + " " + argList.join(" ")
    }
    loadCategory(category: Category) {
        if (this.getCategory(category.name)) throw new Error("Category name has already been registered.")
        category.commands.map((cmd: cmd) => this.addCommand(cmd))
        this.categories.set(category.name, category)
    }
    unloadCategory(name: string) {
        const category = this.getCategory(name)
        if (!category) return
        category.commands.map((a: { name: string }) => {
            this.commands.delete(a.name)
        })
        this.categories.delete(name)
        if (category.path) delete require.cache[require.resolve(category.path)]
    }
    reloadCategory(name: string, useDefault?: boolean) {
        const cat = this.getCategory(name)
        if (!cat) throw new Error("No category found.")
        this.unloadCategory(name)
        if (!cat.path) throw new Error("No path to reload from.")
        const module = useDefault ? require(cat.path).default : require(cat.path)
        this.loadCategory(module)
    }
    getCategory(name: string) { return this.categories.get(name) }
    addCommand(cmd: cmd) {
        const check = this.getCommand(cmd.name)
        if (check) {
            if (check.category) {
                this.unloadCategory(check.category)
            }
            throw new Error("Command name/alias has already been registed.")
        }
        if (!cmd.exec) {
            if (!(cmd instanceof Group)) throw new Error("Command is missing \"exec\" function.")
            else {
                const sub = Array.from((cmd as Group).subcommands.values()).map(a => `> \`${a.name}\` — ${a.description ? a.description : "No Description."}`)
                cmd.setExec(async function(ctx) {
                    ctx.send(`\`🌺\` Subcommands | \`${cmd.name} (${(cmd as Group).subcommands.size})\`\n${sub.join("\n")}`)
                })
            }
        }
        if (cmd.aliases) {
            if (new Set(cmd.aliases).size !== cmd.aliases.length) throw new Error("Command aliases already registered.")
        }
        this.commands.set(cmd.name, cmd)
        if (cmd.cooldown) this.cooldowns[cmd.cooldown.bucketType].set(cmd.name, new Pile)
    }
    removeCommand(name: string) {
        const cmd = this.getCommand(name)
        if (!cmd) return
        this.commands.delete(name)
        if (!cmd.category || !cmd.path) return
        delete require.cache[require.resolve(cmd.path)]
    }
    reloadCommand(name: string, useDefault?: boolean) {
        const tempCmd = this.getCommand(name)
        if (!tempCmd) throw new Error("No command found.")
        if (!tempCmd.path) throw new Error("No path to reload from.")
        this.removeCommand(tempCmd.name)
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const module = useDefault ? require(tempCmd.path).default : require(tempCmd.path)
            this.addCommand(module)
        }
        catch (e) {
            this.addCommand(tempCmd)
            throw e
        }
    }
    getCommand(q: string): cmd { 
        const query = q.split(" ")
        let cmd = this.commands.get(query[0]) || Array.from(this.commands.values()).filter((command) => command.aliases && command.aliases.includes(query[0]))
        if (!cmd) return null
        if (query.length > 1 && cmd && (cmd as Group).subcommands.size) cmd = (cmd as Group).getSubcommand(query[1])
        return cmd instanceof Array ? cmd[0] : cmd
    }
    cleanMention(stringWithMention: string, ctx: CommandContext) {
        return stringWithMention.replace(new RegExp(`<@!?${this.user.id}>`, "g"), `@${ctx.guild?.me.nick ?? this.user.name}`)
    }
    defaultHelp = new Command({ name: "help" })
        .setArgs([{ name: "cm", type: "str", useRest: true }])
        .setExec(async function (ctx) {
            let cats: string[]
            const cm = ctx.args.cm as string
            if (!ctx.args.cm || ctx.args.cm === "undefined") {
                const non = Array.from(ctx.bot.commands.values()).filter((command: Command) => !command.category)
                cats = Array.from(ctx.bot.categories.values()).map((x: any) => `> ${x.name} (${x.commands.length} Command${x.commands.length === 1 ? "" : "s"})`)
                if (non.length) cats.push(`> no-category (${non.length} Command${non.length === 1 ? "" : "s"})`)
                await ctx.send(ctx.bot.cleanMention(`\`🌺\` Categories\n${cats.join("\n")}\n\n> Get command or category help with \`${ctx.prefix}help [command or module name]\``, ctx))
            }
            else {
                const cmd = ctx.bot.getCommand(cm)
                if (!cmd) {
                    const category = ctx.bot.getCategory(cm)
                    if (category) {
                        const cmds = category.commands.map((x: Command) => {
                            if (!x.hidden) return `> \`${x.name}\` — ${x.description ? x.description : "No Description."}`
                        })
                        if (!cmds.length) cmds.push("> No visible commands availible.")
                        return ctx.send(ctx.bot.cleanMention(`\`🌺\` Category | ${category.name}\n${cmds.join("\n")}\n\n> Get command help with \`${ctx.prefix}help [command name]\``, ctx))
                    }
                    if (ctx.args.cm === "no-category") {
                        const cmds = Array.from(ctx.bot.commands.values()).filter((command: cmd) => !command.category).map((x: cmd) => {
                            if (!x.hidden) return `> \`${x.name}\` — ${x.description ? x.description : "No Description."}`
                        })
                        if (!cmds.length) cmds.push("> No visible commands availible.")
                        return ctx.send(ctx.bot.cleanMention(`\`🌺\` Category | no-category\n${cmds.join("\n")}\n\n> Get command help with \`${ctx.prefix}help [command name]\``, ctx))
                    }
                    return ctx.send("`❌` No command or category found.")
                }
                return ctx.send(`\`🌺\` Command Help | \`${cmd.parent ? ctx.bot.getCommand(cmd.parent).name+" "+cmd.name : cmd.name}\`\n> Description: ${cmd.description ? cmd.description : "No Description."}\n> Usage: \`${ctx.bot.getHelp(ctx, cmd)}\`${cmd.cooldown ? `\n> Cooldown: ${cmd.cooldown}ms` : ""}${(cmd as Group).subcommands ? `\n> Subcommands: ${Array.from((cmd as Group).subcommands.values()).map((a: Command) => a.name).join(", ")}` : ""}`)
            }
        })
    async processCommands(msg: Message | Interaction): Promise<void> {
        const prefixToUse = msg instanceof Interaction ? "/" : this.commandOptions.prefix
        let i
        if (msg instanceof Interaction) { 
            i = msg
            msg = msg.asMessage 
        }
        if (msg.author.bot) return
        let re: string, p: unknown[], pre
        switch (typeof prefixToUse) {
        case "string":
            re = prefixToUse
            break
        case "object":
            re = prefixToUse.map(e => e).join("|")
            break
        case "function":
            pre = await prefixToUse.bind(this)(this, msg)
            switch (typeof pre) {
            case "string":
                re = `${pre}`
                break
            case "function":
                p = pre.bind(this)()
                re = `^${typeof p === "string" ? p : p.join("|")}`
                break
            case "object":
                re = `${pre.map((e: string) => escapeRegex(e.replace(/ /g, "\\s?").replace(/\?/g, "?"))).join("|")}`
                break
            default:
                throw new Error(`Prefix function output must be string or object (array). Not ${typeof pre}.`)
            }

        // eslint-disable-next-line no-fallthrough
        default: throw new Error(`Prefix must be string, array or function. Not ${typeof this.commandOptions.prefix}`)
        }
        const prefixArray = Array.from(msg.content.match(new RegExp(`(${re})`, "i")))
        if (!prefixArray) return
        const prefix = prefixArray[0]
        if (!prefix) return
        const 
            args = msg.content.slice(prefix.length).split(" "), 
            name = args.shift().toLowerCase(), 
            command = this.commands.get(name) || Array.from(this.commands.values()).filter((command) => command.aliases && command.aliases.includes(name))
        if (command instanceof Array && !command.length) return
        let cmd: cmd = command instanceof Array ? command[0] : command, parent: Command
        const ctx = i ? new CommandContext(msg, this, cmd, prefix, i) : new CommandContext(msg, this, cmd, prefix)
        if ((cmd as Group).subcommands && args.length > 0) {
            const subcmd = (cmd as Group).getSubcommand(args.shift().toLowerCase())
            if (subcmd) {
                ctx.invokedSubcommand = subcmd
                parent = cmd
                cmd = subcmd
            }
        }
        if (cmd.slashOnly && !i) return  
        if (cmd.guildOnly) {
            if (!ctx.guild) {
                const err = new Errors.NoPrivate("NO_PRIVATE")
                this.emit("cmd.error", ctx, err)
                return
            }
            if (cmd.memberPerms) {
                try {
                    if (ctx.author.id !== ctx.guild.ownerID) { 
                        const missingMemberPerms = cmd.memberPerms.filter(d => !((ctx.author as Member).permissions.bitset & BigInt(guildPermissions[d])))
                        if (missingMemberPerms.length) throw new Errors.MissingMemberPerms(missingMemberPerms)
                    }
                }
                catch (err) {
                    this.emit("cmd.error", ctx, err)
                    return
                }
            }
            if (cmd.botPerms) {
                try {
                    if (ctx.guild.me.id !== ctx.guild.ownerID) { 
                        const missingBotPerms = cmd.botPerms.filter(d => !(ctx.guild.me.permissions.bitset & BigInt(guildPermissions[d]))) 
                        if (missingBotPerms.length) throw new Errors.MissingBotPerms(missingBotPerms) 
                    }
                }
                catch (err) {
                    this.emit("cmd.error", ctx, err)
                    return
                }
            }
        }
        if (cmd.category) {
            const checks = this.getCategory(cmd.category).globalChecks
            if (checks) {
                for (const check of checks) {
                    try {
                        if (typeof check !== "function") throw new TypeError(`Check must be a function. Not ${typeof check}.`)
                        const res = await check(ctx)
                        if (!res) throw new Errors.CheckFailure(check.name)
                    } 
                    catch (err) {
                        this.emit("cmd.error", ctx, err)
                        return
                    }
                }
            }
        }
        if ((parent && parent.checks) || cmd.checks) {
            let allChecks: checkExec[] = []
            if (parent && parent.checks) allChecks = allChecks.concat(parent.checks)
            if (cmd.checks) allChecks = allChecks.concat(cmd.checks)
            for (const check of allChecks) {
                try {
                    if (typeof check !== "function") throw new TypeError(`Check must be a function. Not ${typeof check}.`)
                    const res = await check(ctx)
                    if (!res) throw new Errors.CheckFailure(check.name)
                } catch (err) {
                    this.emit("cmd.error", ctx, err)
                    return
                }
                
            }
        }
        const timer = Date.now()
        this.emit("cmd.before", ctx)
        try {
            await this.validateArguments(ctx, cmd, args)
        } 
        catch (err) {
            this.emit("cmd.error", ctx, err)
            return
        }
        if (cmd.cooldown) {
            let idToUse: string
            switch (cmd.cooldown.bucketType) {
            case "channel": 
                idToUse = ctx.channel.id
                break
            case "guild":
                idToUse = ctx.guild?.id
                break
            case "user":
                idToUse = ctx.author.id
                break
            }
            if (idToUse) {
                let times = this.cooldowns[cmd.cooldown.bucketType].get(cmd.name)
                if (!times) {
                    this.cooldowns[cmd.cooldown.bucketType].set(cmd.name, new Pile)
                    times = this.cooldowns[cmd.cooldown.bucketType].get(cmd.name)
                }
                const now = Date.now()
                if (times.has(idToUse)) {
                    const expires = times.get(idToUse) + cmd.cooldown.time
                    if (now < expires) {
                        const left = (expires - now) / 1000
                        this.emit("cmd.cooldown", ctx, left)
                        return
                    }
                }
                times.set(idToUse, Date.now())
                setTimeout(() => times.delete(idToUse, cmd.cooldown.time))
            }
            
        }
        this.emit("cmd", ctx)
        try {
            await cmd.exec(ctx)
            this.emit("cmd.after", ctx, timer)
        } catch (e) {
            const err = new Errors.ExecutionError(e)
            this.emit("cmd.error", ctx, err)
        }
    }
    
    async validateArguments(ctx: CommandContext, cmd: Command, args: string[]) {
        if (!cmd.args) return
        const properArgs = {}
        const requiredArgs = Array.from(cmd.args).reduce((a, c) => a + Number(c.required), 0)
        if (args.length < requiredArgs) throw new Errors.MissingArguments("MISSING_ARGS")
        if (args.length > cmd.args.length && !cmd.args[cmd.args.length - 1].useRest) throw new Errors.InvalidArguments("INVALID_ARGS")
        for (let i = 0; i < cmd.args.length; i++) {
            let argg: argumentTypes
            const 
                argument = cmd.args[i],
                toUse = argument.useRest ? args.slice(i).join(" ") : args[i]
            if (!toUse && argument.required) throw new Errors.InvalidArguments("INVALID_ARGS")
            switch (argument.type) {
            case "str":
                argg = String(toUse)
                break
            case "num":
                argg = Number(toUse)
                break
            case "bool":
                if (toUse.toLowerCase().match("y|yes|true|t|1")) argg = true
                else if (toUse.toLowerCase().match("n|no|false|f|0")) argg = false
                else throw new Errors.InvalidArguments("INVALID_ARGS")
                break
            case "member":
                argg = await Converters.memberConverter(ctx, toUse)
                break
            case "user":
                argg = await Converters.userConverter(ctx, toUse)
                break
            case "channel":
                argg = await Converters.channelConverter(ctx, toUse)
                break
            case "role":
                argg = await Converters.roleConverter(ctx, toUse)
                break
            }
            if (argument.required && (Number.isNaN(argg) || argg === "" || ((argument.type === "member" || argument.type === "user") && !argg))) throw new Errors.InvalidArguments("INVALID_ARGS")
            properArgs[argument.name] = argg
            if (argument.useRest) break
        }
        ctx.args = properArgs
    }
}