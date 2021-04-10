import type CommandContext from "./context"

export async function isOwner(ctx: CommandContext) {
    if (ctx.bot.commandOptions.ownerID) {
        if (typeof ctx.bot.commandOptions.ownerID === "object") return ctx.bot.commandOptions.ownerID.includes(ctx.author.id)
        else return ctx.bot.commandOptions.ownerID === ctx.author.id
    }
    else {
        const d = await ctx.bot.getAppInfo()
        if (d.team) {
            return Boolean(d.team.members.filter(m => m.id === ctx.author.id).length)
        }
        else {
            return d.owner.id === ctx.author.id
        }

    }
}
