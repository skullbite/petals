import { GuildChannels } from "../models/channel"
import Role from "../models/role"
import { Member, User } from "../models/user"
import CommandContext from "./context"
const
    nameRegex = new RegExp(".{2,32}$"),
    tagRegex = new RegExp(".{2,32}#[0-9]{4}$"),
    nickRegex = new RegExp(".{1,32}$"),
    mentionRegex = new RegExp("<@!?[0-9]{15,21}>$"),
    idRegex = new RegExp("([0-9]{15,21})$"),
    channelMentionRegex = new RegExp("<#[0-9]{15,21}>$"),
    altNameRegex = new RegExp(".{1,100}$"),
    roleMentionRegex = new RegExp("<@&[0-9]{15,21}>$"),
    emojiRegex = new RegExp("<a?:.+?:d+>")

export function memberConverter(ctx: CommandContext, q: string): Member {
    let mem
    if (!ctx.guild) throw new Error("No guild found in context.")
    if (q.match(idRegex)) mem = ctx.guild.members.getFirst(m => q === m.id)
    if (q.match(mentionRegex)) mem = ctx.guild.members.getFirst(m => Boolean(q.match(new RegExp(`<@!?${m.id}>$`))))
    if (q.match(tagRegex)) mem = ctx.guild.members.getFirst(m => q === `${m.name}#${m.discriminator}`)
    if (q.match(nickRegex)) mem = ctx.guild.members.getFirst(m => m.nick && q === m.nick)
    if (q.match(nameRegex)) mem = ctx.guild.members.getFirst(m => q === m.name)
    return mem
}
export function userConverter(ctx: CommandContext, q: string): User {
    let user
    if (q.match(idRegex)) user = ctx.bot.users.getFirst(u => q === u.id)
    if (q.match(mentionRegex)) user = ctx.bot.users.getFirst(u => Boolean(q.match(new RegExp(`<@!?${u.id}>`))))
    if (q.match(tagRegex)) user = ctx.bot.users.getFirst(u => q === `${u.name}#${u.discriminator}`)
    if (q.match(nameRegex)) user = ctx.bot.users.getFirst(u => q === u.name)
    return user
}
export function channelConverter(ctx: CommandContext, q: string): GuildChannels {
    let channel
    if (!ctx.guild) throw new Error("No guild found in context.")
    if (q.match(idRegex)) channel = ctx.guild.channels.getFirst(c => q === c.id)
    if (q.match(altNameRegex)) channel = ctx.guild.channels.getFirst(c => q === c.name)
    if (q.match(channelMentionRegex)) channel = ctx.guild.channels.getFirst(c => q === `<#${c.id}>`)
    return channel
}
export function roleConverter(ctx: CommandContext, q: string): Role {
    let role
    if (!ctx.guild) throw new Error("No guild found in context.")
    if (q.match(idRegex)) role = ctx.guild.roles.getFirst(r => q === r.id)
    if (q.match(altNameRegex)) role = ctx.guild.roles.getFirst(r => q === r.name)
    if (q.match(roleMentionRegex)) role = ctx.guild.roles.getFirst(r => q === r.ping)
    return role
}
