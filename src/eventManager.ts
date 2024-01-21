import {
    EmbedBuilder,
    time,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    TextBasedChannel,
    Message,
    GuildTextBasedChannel,
    Client,
    BaseGuildTextChannel,
    ChatInputCommandInteraction,
} from 'discord.js';

import { Giveaway } from './types/GiveawayData';

import * as date from 'date-and-time';
import db from './db.js';
import { Fetch } from './types/Data';

function SelectWinners(fetch: Fetch, number: number): string[] {
    if (fetch.entries.length === 0) {
        return undefined;
    };

    let areWinnersInPreviousWinners = (currentWinners: string[]) => {
        return currentWinners.some(winner => fetch.winners.includes(winner));
    };

    let winners: Array<string> = [];

    do {
        winners = [];
        let availableMembers = [...fetch.entries];

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

async function Create(channel: TextBasedChannel, data: Giveaway) {

    let confirm = new ButtonBuilder()
        .setCustomId('confirm-entry-giveaway')
        .setEmoji('🎉')
        .setStyle(ButtonStyle.Primary);

    let gw = new EmbedBuilder()
        .setColor('#9a5af2')
        .setTitle(data.prize)
        .setDescription(`Ends: ${time((date.addMilliseconds(new Date(), data.duration)), 'R')} (${time((date.addMilliseconds(new Date(), data.duration)), 'D')})\nHosted by: ${data.hostedBy}\nEntries: **0**\nWinners: **${data.winnerCount}**`)
        .setTimestamp((date.addMilliseconds(new Date(), data.duration)));

    let response = await channel.send({
        embeds: [gw],
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(confirm)
        ]
    });

    db.Create(
        {
            channelId: response.channelId,
            guildId: response.guildId,

            winnerCount: data.winnerCount,
            prize: data.prize,
            hostedBy: data.hostedBy,
            expireIn: (date.addMilliseconds(new Date(), data.duration) as unknown as number),
            ended: false,
            entries: [],
            winners: [],
            isValid: true,
        }, response.id
    )
    return;
};

function End(client: Client, giveawayId: string) {

    let fetch = db.GetGiveawayData(giveawayId).isValid

    if (fetch && !db.GetGiveawayData(giveawayId).ended) {
        db.SetEnded(giveawayId, "End()");

        Finnish(
            client,
            giveawayId,
            db.GetGiveawayData(giveawayId).guildId,
            db.GetGiveawayData(giveawayId).channelId,
        );
    } else return 404;
};

async function Finnish(client: Client, giveawayId: string, guildId: string, channelId: string) {
    let fetch = db.GetGiveawayData(giveawayId);

    if (!fetch.ended === true || fetch.ended === 'End()') {
        let guild = await client.guilds.fetch(guildId).catch(async () => {
            db.DeleteGiveaway(giveawayId)
        });
        if (!guild) return;

        let channel = await guild.channels.fetch(channelId);

        let message = await (channel as GuildTextBasedChannel).messages.fetch(giveawayId).catch(async () => {
            db.DeleteGiveaway(giveawayId)
            return;
        }) as Message;

        let winner = SelectWinners(
            { entries: fetch.entries, winners: fetch.winners },
            fetch.winnerCount
        );

        let winners = winner ? winner.map((winner: string) => `<@${winner}>`) : 'None';

        let Finnish = new ButtonBuilder()
            .setLabel("Giveaway Finished")
            .setURL('https://media.tenor.com/uO4u0ib3oK0AAAAC/done-and-done-spongebob.gif')
            .setStyle(ButtonStyle.Link);

        let embeds = new EmbedBuilder()
            .setColor('#2f3136')
            .setTitle(fetch.prize)
            .setDescription(`Ended: ${time(new Date(fetch.expireIn), 'R')} (${time(new Date(fetch.expireIn), 'D')})\nHosted by: <@${fetch.hostedBy}>\nEntries **${fetch.entries.length}**\nWinners: ${winners}`)
            .setTimestamp()

        await message?.edit({
            embeds: [embeds], components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(Finnish)]
        });

        if (winners !== 'None') {
            await message?.reply({
                content: `Congratulations ${winners}! You won the **${fetch.prize}**!`
            })
        } else {
            await message?.reply({
                content: "No valid entrants, so a winner could not be determined!"
            });
        };

        db.SetEnded(giveawayId, true)
        db.SetWinners(giveawayId, winner || 'None')
    };
    return;
};

async function Reroll(client: Client, giveawayId: string) {

    let fetch = db.GetGiveawayData(giveawayId);

    let guild = await client.guilds.fetch(fetch.guildId);
    let channel = await guild.channels.fetch(fetch.channelId);

    let message = await (channel as BaseGuildTextChannel).messages.fetch(giveawayId).catch(async () => {
        db.DeleteGiveaway(giveawayId)
        return;
    }) as Message;

    let winner = SelectWinners(
        { entries: fetch.entries, winners: fetch.winners },
        fetch.winnerCount
    );

    let winners = winner ? winner.map((winner: string) => `<@${winner}>`) : [];

    let embeds = new EmbedBuilder()
        .setColor('#2f3136')
        .setTitle(fetch.prize)
        .setDescription(`Ended: ${time(new Date(fetch.expireIn), 'R')} (${time(new Date(fetch.expireIn), 'D')})\nHosted by: <@${fetch.hostedBy}>\nEntries **${fetch.entries.length}**\nWinners: ${winners}`)
        .setTimestamp()

    await message?.edit({
        embeds: [embeds]
    });

    if (winner && winner[0] !== 'None') {
        await message?.reply({
            content: `Congratulations ${winners}! You won the **${fetch.prize}**!`
        });
    } else {
        await message?.reply({
            content: "No valid entrants, so a winner could not be determined!"
        });
    };

    db.SetWinners(giveawayId, winner || 'None')
    return;
};

async function ListEntries(interaction: ChatInputCommandInteraction, giveawayId: string) {
    let fetch = db.GetGiveawayData(giveawayId);

    if (interaction.guildId === fetch.guildId) {
        var char: Array<string> = fetch.entries;

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
};

export {
    Create,
    End,
    Finnish,
    Reroll,
    ListEntries
};