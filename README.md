## Script.db

Powerful Database framework for discord bots.

<a href="https://discord.gg/4dSNfBhgMR"><img src="https://img.shields.io/discord/752215842959130655?color=7289da&logo=discord&logoColor=white" /></a> <a href="https://www.npmjs.com/package/script.db"><img src="https://img.shields.io/npm/v/script.db.svg?maxAge=3600" /></a> <a href="https://www.npmjs.com/package/script.db"><img src="https://img.shields.io/npm/dt/script.db.svg?maxAge=3600" /></a>

![Script.db](https://nodei.co/npm/script.db.png)

## Installing

```bash
$ npm i --save script.db
```

## Links

- [Documentation](https://script.db.hiekki.gq)
- [Discord Support Server](https://discord.gg/4dSNfBhgMR)
- [NPM](https://npmjs.com/package/script.db)

## Getting Started

```js
const db = require('script.db');

// Setting an object in the database:
db.set(`money_${message.guild.id}_${user.id}`)

// Pushing an element to an array (that doesn't exist yet) in an object:
db.push(`money_${message.guild.id}_${user.id}`)

// Adding to a number (that doesn't exist yet) in an object:
db.add(`money_${message.guild.id}_${user.id}`, "1000")

// Fetching individual properties
db.get(`money_${message.guild.id}_${user.id}`)
```
## Example

```js
const Discord = require("discord.js");
const client = new Discord.Client();
const db = require('script.db');

client.on("ready", () => console.log('ready!'));

client.on("message", async (message) => {
    if (!message.guild || message.author.bot) return;

    if (message.content === "balance") {

  let user = message.mentions.members.first() || message.author;

  let bal = db.fetch(`money_${message.guild.id}_${user.id}`)

  if (bal === null) bal = 0;

  let bank = await db.fetch(`bank_${message.guild.id}_${user.id}`)
  if (bank === null) bank = 0;

  let moneyEmbed = new Discord.MessageEmbed()
  .setColor("#FFFFFF")
  .setDescription(`**${user}'s Balance**\n\nPocket: ${bal}\nBank: ${bank}`);
  message.channel.send(moneyEmbed)
    }
});

client.login("XXXXXXXXXXXXXX");
```

## MongoDB Module

```js
const Discord = require("discord.js");
const client = new Discord.Client();
const { Database } = require("script.db-mongo");
const db = new Database("mongodb://localhost/");

db.on("ready", () => {
    console.log("Database connected!");
});

client.on("ready", () => console.log('ready!'));

client.on("message", async (message) => {
    if (!message.guild || message.author.bot) return;

    if (message.content === "balance") {

  let user = message.mentions.members.first() || message.author;

  let bal = db.fetch(`money_${message.guild.id}_${user.id}`)

  if (bal === null) bal = 0;

  let bank = await db.fetch(`bank_${message.guild.id}_${user.id}`)
  if (bank === null) bank = 0;

  let moneyEmbed = new Discord.MessageEmbed()
  .setColor("#FFFFFF")
  .setDescription(`**${user}'s Balance**\n\nPocket: ${bal}\nBank: ${bank}`);
  message.channel.send(moneyEmbed)
    }
});

client.login("XXXXXXXXXXXXXX");
```