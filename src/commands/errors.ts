import { permissionKeys } from "../models/permissions"
export class NoPrivate extends Error {}
export class CheckFailure extends Error {}
export class MissingArguments extends Error {}
export class InvalidArguments extends Error {}
export class MissingBotPerms extends Error {
    permissonsMissing: permissionKeys[]
    constructor(permissionsMissing: permissionKeys[]) {
        super("MISSING_BOT_PERMS")
        this.permissonsMissing = permissionsMissing
    }
}
export class MissingMemberPerms extends Error {
    permissonsMissing: permissionKeys[]
    constructor(permissionsMissing: permissionKeys[]) {
        super("MISSING_MEMBER_PERMS")
        this.permissonsMissing = permissionsMissing
    }
}
export class ExecutionError extends Error {
    original: Error
    constructor(original: Error) {
        super("EXEC_ERR")
        this.original = original
    }
}

export type ErrorTypes = NoPrivate|MissingBotPerms|MissingMemberPerms|CheckFailure|MissingArguments|InvalidArguments|ExecutionError