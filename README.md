# 🌺 **Petals**
Discord API Wrapper made with nothing more than the intention of further learning (and typescript, can't forget typescript). 

# Basic Usage
```js
const 
    Petals = require("@skullbite/petals"), 
    bot = new Petals.Client({})

bot.on("ready", () => console.log(`${bot.user.tag} is ready!`)
bot.on("msg", (m) => {
    if (m.content === "!hi") m.reply("hello!")
    }
})

bot.run("cool token here")
```
```js
// Use with the builtin command handler
const 
    Petals = require("./index"),
    { Commands } = Petals,
    bot = new Commands.Bot({ prefix: "!" }, {})

bot.addCommand(
    new Commands.Command({ name: "hi" })
        .setExec(function (ctx) {
            ctx.reply("hello!")
        })
)
bot.run("cool token here")
```
# Documentation?
Sorry, although base functionality is working fine, proper documentation is currently being worked on.

# Extended Credits
- [**Ice**](https://github.com/IceeMC) for fixing command handler issues.
- [**PapiOphidan**](https://github.com/PapiOphidian) for helping me with REST stuff.
- [**BowsiePup**](https://github.com/BowsiePup) / [**Donovan_DMC**](https://github.com/DonovanDMC) for helping me write the original command handler.
- [**August**](https://github.com/auguwu) for ✨*inspiration*✨ (no i didn't steal wumpcord)