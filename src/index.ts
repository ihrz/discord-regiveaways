import {
    EmbedBuilder,
    time,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    Client,
    BaseGuildTextChannel,
    GuildTextBasedChannel,
    ChatInputCommandInteraction,
    TextBasedChannel,
    Message
} from 'discord.js';

import { Giveaway } from './types/GiveawayData';
import { Data } from './types/Data';

import * as date from 'date-and-time';
import db from './db.js';


interface Fetch {
    members: string | any[];
    winners: string | string[];
};

function SelectWinners(fetch: Fetch, number: number) {
    if (fetch.members.length === 0) {
        return undefined;
    };

    let areWinnersInPreviousWinners = (currentWinners: string[]) => {
        return currentWinners.some(winner => fetch.winners.includes(winner));
    };

    let winners: Array<string> = [];

    do {
        winners = [];
        let availableMembers = [...fetch.members];

        if (winners.length === 0 || areWinnersInPreviousWinners(winners)) {
            winners = [];
        };

        for (let i = 0; i < number; i++) {
            if (availableMembers.length === 0) {
                break;
            }

            let randomIndex = Math.floor(Math.random() * availableMembers.length);
            let winnerID = availableMembers.splice(randomIndex, 1)[0];
            winners.push(winnerID);
        }
    } while (winners.length === 0);

    return winners.length > 0 ? winners : undefined;
};


async function Reroll(client: Client, data: Data) {

    let fetch = await db.get(`GIVEAWAYS.${data.guildId}`);

    for (let channelId in fetch) {
        for (let messageId in fetch[channelId]) {
            if (messageId === data.messageId) {

                let guild = await client.guilds.fetch(data.guildId as string);
                let channel = await guild.channels.fetch(channelId);

                let message = await (channel as BaseGuildTextChannel).messages.fetch(messageId).catch(async () => {
                    db.delete(`GIVEAWAYS.${data.guildId}.${channel?.id}.${data.messageId}`);
                    return;
                }) as Message;

                let winner = SelectWinners(
                    fetch[channelId][messageId],
                    fetch[channelId][messageId].winnerCount
                );

                let winners = winner ? winner.map((winner: string) => `<@${winner}>`) : [];

                let embeds = new EmbedBuilder()
                    .setColor('#2f3136')
                    .setTitle(fetch[channelId][messageId].prize)
                    .setDescription(`Ended: ${time(new Date(fetch[channelId][messageId].expireIn), 'R')} (${time(new Date(fetch[channelId][messageId].expireIn), 'D')})\nHosted by: <@${fetch[channelId][messageId].hostedBy}>\nEntries **${fetch[channelId][messageId].members.length}**\nWinners: ${winners}`)
                    .setTimestamp()

                await message?.edit({
                    embeds: [embeds]
                });

                if (winner && winner[0] !== 'None') {
                    await message?.reply({
                        content: `Congratulations ${winners}! You won the **${fetch[channelId][messageId].prize}**!`
                    });
                } else {
                    await message?.reply({
                        content: "No valid entrants, so a winner could not be determined!"
                    });
                };

                await db.set(`GIVEAWAYS.${data.guildId}.${channelId}.${messageId}.winner`, winner || 'None');
            };
        };
    };

};

function GiveawaysManager_Init(client: Client) {
    Refresh(client);

    setInterval(() => {
        Refresh(client);
    }, 4500);
};


async function Refresh(client: Client) {
    let drop_all_db = await db.get(`GIVEAWAYS`);

    for (let guildId in drop_all_db) {
        // guildId: Server Guild ID
        // b: Giveaway's Message ID
        // drop_all_db[a][b] : Giveaway Object

        for (let channelId in drop_all_db[guildId]) {
            for (let messageId in drop_all_db[guildId][channelId]) {
                let now = new Date().getTime();
                let gwExp = new Date(drop_all_db[guildId][channelId][messageId]?.expireIn).getTime();
                let cooldownTime = now - gwExp;

                if (now >= gwExp) {
                    // Finnish(
                    //     client,
                    //     messageId,
                    //     guildId,
                    //     channelId
                    // );
                };

                if (cooldownTime >= 345_600_000) {
                    db.delete(`GIVEAWAYS.${guildId}.${channelId}.${messageId}`);
                };
            }
        }
    }
};

async function ListEntries(interaction: ChatInputCommandInteraction, data: Data) {
    let drop_all_db = await db.get(`GIVEAWAYS`);

    for (let guildId in drop_all_db) {
        // guildId: Server Guild ID
        // b: Giveaway's Message ID
        // drop_all_db[a][b] : Giveaway Object

        for (let channelId in drop_all_db[guildId]) {
            for (let messageId in drop_all_db[guildId][channelId]) {
                if (messageId === data.messageId && guildId === data.guildId) {
                    var char: Array<string> = drop_all_db[guildId][channelId][messageId].members;

                    if (char.length == 0) {
                        await interaction.editReply({ content: "There is no entry into this competition." });
                        return;
                    };

                    let currentPage = 0;
                    let usersPerPage = 10;
                    let pages: { title: string; description: string; }[] = [];

                    for (let i = 0; i < char.length; i += usersPerPage) {
                        let pageUsers = char.slice(i, i + usersPerPage);
                        let pageContent = pageUsers.map((userId) => `<@${userId}>`).join('\n');
                        pages.push({
                            title: `Giveaway's Entries List | Page ${i / usersPerPage + 1}`,
                            description: pageContent,
                        });
                    };

                    let createEmbed = () => {
                        return new EmbedBuilder()
                            .setColor("#800080")
                            .setTitle(pages[currentPage].title)
                            .setDescription(pages[currentPage].description)
                            .setFooter({ text: `iHorizon | Page ${currentPage + 1}/${pages.length}`, iconURL: interaction.client.user?.displayAvatarURL() })
                            .setTimestamp()
                    };

                    let row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('previousPage')
                            .setLabel('⬅️')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('nextPage')
                            .setLabel('➡️')
                            .setStyle(ButtonStyle.Secondary),
                    );

                    let messageEmbed = await interaction.editReply({
                        embeds: [createEmbed()], components: [(row as ActionRowBuilder<ButtonBuilder>)]
                    });

                    let collector = messageEmbed.createMessageComponentCollector({
                        filter: (i) => {
                            i.deferUpdate();
                            return interaction.user.id === i.user.id;
                        }, time: 60000
                    });

                    collector.on('collect', (interaction: { customId: string; }) => {
                        if (interaction.customId === 'previousPage') {
                            currentPage = (currentPage - 1 + pages.length) % pages.length;
                        } else if (interaction.customId === 'nextPage') {
                            currentPage = (currentPage + 1) % pages.length;
                        }

                        messageEmbed.edit({ embeds: [createEmbed()] });
                    });

                    collector.on('end', () => {
                        row.components.forEach((component) => {
                            if (component instanceof ButtonBuilder) {
                                component.setDisabled(true);
                            }
                        });
                        messageEmbed.edit({ components: [(row as ActionRowBuilder<ButtonBuilder>)] });
                    });
                };
            }
        }
    }
}

export {
    GiveawaysManager_Init,

    Reroll,
    ListEntries
};