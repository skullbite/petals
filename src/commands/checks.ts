import type CommandContext from "./context"

export function isOwner(ctx: CommandContext) {
    if (typeof ctx.bot.commandOptions.ownerID === "object") return ctx.bot.commandOptions.ownerID.includes(ctx.author.id)
    else return ctx.bot.commandOptions.ownerID === ctx.author.id
}
