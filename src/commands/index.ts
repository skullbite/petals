export function escapeRegex(str: string) {
    return str.replace(/[-[\]{}()*+?.,\\^$|#]/g, "\\$&")
}
export function whenMentioned() { return [`<@${this.user.id}> `, `<@!${this.user.id}> `, `<@${this.user.id}>`, `<@!${this.user.id}>`] }
export function whenMentionedOr(basePrefix: string | string[]) {
    const f = function () {
        const p = [`<@${this.user.id}> `, `<@!${this.user.id}> `, `<@${this.user.id}>`, `<@!${this.user.id}>`]
        if (typeof basePrefix === "object") basePrefix.map(pre => { p.push(escapeRegex(pre)) })
        else if (typeof basePrefix === "string") p.push(escapeRegex(basePrefix))
        else throw new Error(`Prefix must either be array or string. Not ${typeof basePrefix}.`)
        return p
    }
    return f
}
export * as Checks from "./checks"
export { default as Category } from "./category"
export { Command, Group } from "./command"
export { default as Bot } from "./commandclient"
export { default as Context } from "./context"
export * as Errors from "./errors"