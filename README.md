# Discord RE-Giveaways

[![discordBadge](https://img.shields.io/badge/Chat-Click%20here-7289d9?style=for-the-badge&logo=discord)](https://discord.gg/ihorizon)
[![downloadsBadge](https://img.shields.io/npm/dt/discord-regiveaways?style=for-the-badge)](https://npmjs.com/discord-regiveaways)
[![versionBadge](https://img.shields.io/npm/v/discord-regiveaways?style=for-the-badge)](https://npmjs.com/discord-regiveaways)

Discord RE-Giveaways is a powerful [Node.js](https://nodejs.org) module that allows you to easily create giveaways!

[![Static Badge](https://img.shields.io/badge/Created%20by%20iHorizon%20Team-blue)](https://ihorizon.me)

## Features

-   ⏱️ Easy to use!
-   🔄 Automatic restart after bot crash!
<!-- -   🇫🇷 Support for translations: adapt the strings for your own language! -->
<!-- -   📁 Support for all databases! (default is json) -->
-   ⚙️ Very customizable! (prize, duration, winners, ignored permissions, bonus entries, etc...)
-   🚀 Super powerful: start, edit, reroll, end, delete giveaways!
-   🕸️ Support for shards!

## Installation

```bash
npm install --save discord-regiveaways
```

### Launch of the module

Required Discord Intents: `Guilds` and `GuildMessageReactions`.  
Optional Discord Privileged Intent for better performance: `GuildMembers`.

```js
import { Client } from 'discord.js';

const client = new Client({
    intents: [
        Discord.IntentsBitField.Flags.Guilds,
        Discord.IntentsBitField.Flags.GuildMessageReactions,
        Discord.IntentsBitField.Flags.GuildMembers
    ]
});

// Requires Manager from discord-regiveaways

/*
    For TypeScript
*/

import { GiveawaysManager } from 'discord-regiveaways';

const manager = new GiveawaysManager(client, {
    storage: './giveaways.json',
    config: {
        botsCanWin: false,
        embedColor: '#FF0000',
        embedColorEnd: '#000000',
        reaction: '💫',
        botName: "Giveaway Bot",
        forceUpdateEvery: 3600,
        endedGiveawaysLifetime: 1_600_000,
    }
});

/*
    For JavaScript
*/
const gw = require('discord-regiveaways');

const manager = new gw.GiveawaysManager(client, {
    storage: './giveaways.json',
    config: {
        botsCanWin: false,
        embedColor: '#FF0000',
        embedColorEnd: '#000000',
        reaction: '💫',
        botName: "Giveaway Bot",
        forceUpdateEvery: 3600,
        endedGiveawaysLifetime: 1_600_000,
    }
});

// We now have a giveawaysManager property to access the manager everywhere!
client.giveawaysManager = manager;

client.on('ready', () => {
    console.log('Bot is ready!');
});

client.login("My cool discord bot token !");
```

After that, giveaways that are not yet completed will start to be updated again and new giveaways can be started.
You can pass an options object to customize the giveaways. Here is a list of them:

-   **client**: the discord client (your discord bot instance).
-   **[and many other optional parameters to customize the manager - read documentation](https://discord-regiveaways.js.org/global.html#GiveawaysManagerOptions)**

### Start a giveaway

```js
client.on('interactionCreate', (interaction) => {
    const ms = require('ms');

    if (interaction.isChatInputCommand() && interaction.commandName === 'start-giveaway') {
        // /start-giveaway 2d 1 Awesome prize!
        // Will create a giveaway with a duration of two days, with one winner and the prize will be "Awesome prize!"

        await interaction.deferReply();

        let giveawayChannel = interaction.channel;
        var giveawayDuration = interaction.options.getString("time");
        let giveawayNumberWinners = interaction.options.getNumber("winner");

        if (isNaN(giveawayNumberWinners as number) || (parseInt(giveawayNumberWinners as unknown as string) <= 0)) {
            await interaction.editReply({ content: "You must specify a valid number of winners!" });
            return;
        };

        let giveawayPrize = interaction.options.getString("prize");
        let giveawayDurationFormated = ms(giveawayDuration as unknown as number);

        if (Number.isNaN(giveawayDurationFormated)) {
            await interaction.editReply({
                content: `${interaction.user}, the giveaway Duration you specified are invalid, please try again!`
            });
            return;
        };

        client.giveawaysManager.create(giveawayChannel as TextBasedChannel, {
            duration: parseInt(giveawayDurationFormated),
            prize: giveawayPrize,
            winnerCount: giveawayNumberWinners,
            hostedBy: interaction.user.id,
            embedImageURL: interaction.options.getString('imageURL') || undefined
        });
    }
});
```

-   **options.duration**: the giveaway duration.
-   **options.prize**: the giveaway prize.
-   **options.winnerCount**: the number of giveaway winners.
<!-- -   **[and many other optional parameters to customize the giveaway - read documentation](https://discord-regiveaways.js.org/global.html#GiveawayStartOptions)** -->

This allows you to start a new giveaway. Once the `create()` function is called, the giveaway starts, and you only have to observe the result, the package does the rest!

<a href="https://github.com/ihrz/discord-regiveaways/blob/main/imgs/giveawayCreated.png?raw=true">
    <img src="https://github.com/ihrz/discord-regiveaways/blob/main/imgs/giveawayCreated.png?raw=true"/>
</a>

#### ⚠ ATTENTION!

The command examples below (reroll, edit delete, end) can be executed on any server your bot is a member of if a person has the `messageId` of a giveaway. To prevent abuse we recommend to check if the `messageId` that was provided by the command user is for a giveaway on the same server, if it is not, then cancel the command execution.

```js
const query = interaction.options.getString('query');
const giveaway =
    // Search with messageId
    client.giveawaysManager.isValid(query);

// If no giveaway was found
if (!giveaway) return interaction.reply(`Unable to find a giveaway for \`${query}\`.`);
```

### Reroll a giveaway

```js
client.on('interactionCreate', (interaction) => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'reroll') {
        const messageId = interaction.options.getString('message_id');
        
        try {
            await client.giveawaysManager.reroll(client, messageId as string);
            
            interaction.reply('Success! Giveaway rerolled!');

        } catch (error) {
            
            interaction.reply(`An error has occurred, please check and try again\n\`${error}\``);

        };
    }
});
```

<a href="https://github.com/ihrz/discord-regiveaways/blob/main/imgs/giveawayReroll.png?raw=true">
    <img src="https://github.com/ihrz/discord-regiveaways/blob/main/imgs/giveawayReroll.png?raw=true"/>
</a>

### Delete a giveaway

```js
client.on('interactionCreate', (interaction) => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'delete') {
        const messageId = interaction.options.getString('message_id');
        
        client.giveawaysManager.delete(messageId)
            .then(() => {
                interaction.reply('Success! Giveaway deleted!');
            })
            .catch((err) => {
                interaction.reply(`An error has occurred, please check and try again.\n\`${err}\``);
            });
    }
});
```

-   **doNotDeleteMessage**: whether the giveaway message shouldn't be deleted.

⚠️ **Note**: when you use the delete function, the giveaway data and the message of the giveaway are deleted (by default). You cannot restore a giveaway once you have deleted it!

### End a giveaway

```js
client.on('interactionCreate', (interaction) => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'end') {
        const messageId = interaction.options.getString('message_id');

        client.giveawaysManager.end(client, inputData as string)
            .then(() => {
                interaction.reply('Success! Giveaway ended!');
            })
            .catch((err) => {
                interaction.reply(`An error has occurred, please check and try again.\n\`${err}\``);
            });
    }
});
```

-   **noWinnerMessage**: Sent in the channel if there is no valid winner for the giveaway. [Message Options](https://github.com/Androz2091/discord-regiveaways#message-options)