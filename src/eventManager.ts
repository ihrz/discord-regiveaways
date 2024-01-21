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
} from 'discord.js';

import { Giveaway } from './types/GiveawayData';

import * as date from 'date-and-time';
import db from './db.js';

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

    if (!db.GetGiveawayData(giveawayId).ended === true || db.GetGiveawayData(giveawayId).ended === 'End()') {
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
            fetch,
            db.GetGiveawayData(giveawayId).winnerCount
        );

        let winners = winner ? winner.map((winner: string) => `<@${winner}>`) : 'None';

        let Finnish = new ButtonBuilder()
            .setLabel("Giveaway Finished")
            .setURL('https://media.tenor.com/uO4u0ib3oK0AAAAC/done-and-done-spongebob.gif')
            .setStyle(ButtonStyle.Link);

        let embeds = new EmbedBuilder()
            .setColor('#2f3136')
            .setTitle(fetch.prize)
            .setDescription(`Ended: ${time(new Date(fetch.expireIn), 'R')} (${time(new Date(fetch.expireIn), 'D')})\nHosted by: <@${fetch.hostedBy}>\nEntries **${fetch.members.length}**\nWinners: ${winners}`)
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

        db.SetEnded(messageId, true)
        db.SetWinners(messageId, winner || 'None')
    };
    return;
};

export {
    Create,
    End,
    Finnish
};

function SelectWinners(fetch: { (input: RequestInfo | URL, init?: RequestInit): Promise<Response>; (input: string | Request | URL, init?: RequestInit): Promise<Response>; }, arg1: number) {
    throw new Error('Function not implemented.');
}
