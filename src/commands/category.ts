import { cmd, checkExec } from "./command"

interface CategoryOpts {
    name: string
    path?: string
}

export default class Category {
    name: string
    commands: cmd[]
    globalChecks?: checkExec[]
    path?: string
    constructor(opts: CategoryOpts) {
        const { name, path } = opts
        if (!opts) throw new Error("Category requires an object.")
        if (!name || !name.length) throw new Error("Category is missing a name.")
        this.name = name
        this.commands = []
        this.path = path
    }
    addCommand(command: cmd): this {
        const c = command
        c.category = this.name
        this.commands.push(c)
        return this
    }
    setChecks(checks: checkExec[]): this {
        this.globalChecks = checks
        return this
    }
}
