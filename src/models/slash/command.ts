import Base from "../base"
const OptionTypes = {
    SUB_COMMAND: 1,
    SUB_COMMAND_GROUP: 2,
    STRING: 3,
    INTEGER: 4,
    BOOLEAN: 5,
    USER: 6,
    CHANNEL: 7,
    ROLE: 8
}
export class SlashCommandOptions {
    type: keyof typeof OptionTypes | string
    name: string
    description: string
    required?: boolean
    choices?: { name: string, value: string|number }[]
    options?: SlashCommandOptions
    constructor(data) {
        const { type, name, description, required, choices, options } = data
        this.type = Object.keys(OptionTypes).find(k => OptionTypes[k] === type)
        this.name = name
        this.description = description
        this.required = required
        this.choices = choices
        this.options = options ? new SlashCommandOptions(options) : undefined
    }
}
export class SlashCommand extends Base {
    appID: string
    name: string
    description: string
    options?: SlashCommandOptions
    constructor(data, bot) {
        super(data.id, bot)
        const { application_id, name, description, options } = data
        this.appID = application_id
        this.name = name
        this.description = description
        this.options = options ? new SlashCommandOptions(options) : undefined
    }
}

