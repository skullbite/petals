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
    roleMentionRegex = new RegExp("<@&[0-9]{15,21}>$")

export async function memberConverter(ctx: CommandContext, q: string): Promise<Member> {
    let mem
    if (!ctx.guild) throw new Error("No guild found in context.")
    if (q.match(idRegex)) mem = ctx.guild.members.getFirst(m => q === m.id)
    if (q.match(mentionRegex) && !mem) mem = ctx.guild.members.getFirst(m => Boolean(q.match(new RegExp(`<@!?${m.id}>$`))))
    if (q.match(tagRegex) && !mem) mem = ctx.guild.members.getFirst(m => q === `${m.name}#${m.discriminator}`)
    if (q.match(nickRegex) && !mem) mem = ctx.guild.members.getFirst(m => m.nick && q === m.nick)
    if (q.match(nameRegex) && !mem) mem = ctx.guild.members.getFirst(m => q === m.name)
    if (!mem && ctx.bot.commandOptions.useRESTFetching && q.match(idRegex)) mem = ctx.guild.fetchMember(q)
    return mem
}
export async function userConverter(ctx: CommandContext, q: string): Promise<User> {
    let user
    if (q.match(idRegex)) user = ctx.bot.users.getFirst(u => q === u.id)
    if (q.match(mentionRegex) && !user) user = ctx.bot.users.getFirst(u => Boolean(q.match(new RegExp(`<@!?${u.id}>`))))
    if (q.match(tagRegex) && !user) user = ctx.bot.users.getFirst(u => q === `${u.name}#${u.discriminator}`)
    if (q.match(nameRegex) && !user) user = ctx.bot.users.getFirst(u => q === u.name)
    if (!user && ctx.bot.commandOptions.useRESTFetching && q.match(idRegex)) user = await ctx.bot.fetchUser(q)
    return user
}
export async function channelConverter(ctx: CommandContext, q: string): Promise<GuildChannels> {
    let channel
    if (!ctx.guild) throw new Error("No guild found in context.")
    if (q.match(idRegex)) channel = ctx.guild.channels.getFirst(c => q === c.id)
    if (q.match(altNameRegex) && !channel) channel = ctx.guild.channels.getFirst(c => q === c.name)
    if (q.match(channelMentionRegex) && !channel) channel = ctx.guild.channels.getFirst(c => q === `<#${c.id}>`)
    if (!channel && ctx.bot.commandOptions.useRESTFetching && q.match(idRegex)) { 
        const channelList = await ctx.guild.fetchChannels()
        channel = channelList.find(c => q === c.id)
    }
    return channel
}
export async function roleConverter(ctx: CommandContext, q: string): Promise<Role> {
    let role
    if (!ctx.guild) throw new Error("No guild found in context.")
    if (q.match(idRegex)) role = ctx.guild.roles.getFirst(r => q === r.id)
    if (q.match(altNameRegex) && !role) role = ctx.guild.roles.getFirst(r => q === r.name)
    if (q.match(roleMentionRegex) && !role) role = ctx.guild.roles.getFirst(r => q === r.ping)
    if (!role && ctx.bot.commandOptions.useRESTFetching && q.match(idRegex)) {
        const roles = await ctx.guild.fetchAllRoles()
        role = roles.filter(r => q === r.id)[0]
    }
    return role
}
