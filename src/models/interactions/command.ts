import Base from "../base"
export const OptionTypes = {
    SUB_COMMAND: 1,
    SUB_COMMAND_GROUP: 2,
    STRING: 3,
    INTEGER: 4,
    BOOLEAN: 5,
    USER: 6,
    CHANNEL: 7,
    ROLE: 8
}
export interface SlashTemplate { 
    name: string, 
    description: string, 
    options?: Options[], 
    default_permission?: boolean
}
export interface Options {
    type: keyof typeof OptionTypes | string
    name: string
    description: string
    required?: boolean
    choices?: {
        name: string,
        value: keyof typeof OptionTypes
    }[]
    options?: Options
}
export class ApplicationCommand extends Base {
    applicationID: string
    name: string
    description: string
    options?: Options
    constructor(data, bot) {
        super(data.id, bot)
        const { application_id, name, description, options } = data
        this.applicationID = application_id
        this.name = name
        this.description = description
        this.options = options
    }
}