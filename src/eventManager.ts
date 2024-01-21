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
            db.delete(`GIVEAWAYS.${guildId}`);
        });
        if (!guild) return;

        let channel = await guild.channels.fetch(channelId);

        let message = await (channel as GuildTextBasedChannel).messages.fetch(giveawayId).catch(async () => {
            db.delete(`GIVEAWAYS.${guildId}.${channelId}.${giveawayId}`);
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
        // db.
        // db.delete(`GIVEAWAYS.${data.guildId}.${channel?.id}.${data.messageId}`);
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

export {
    Create,
    End,
    Finnish,
    Reroll
};