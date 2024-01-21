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
    Message,
    ButtonInteraction,
    CacheType
} from 'discord.js';

import { Giveaway } from './types/GiveawayData';
import { Fetch, Options } from './types/Data';

import { EventEmitter } from 'node:events';
import * as date from 'date-and-time';
import db from './db.js';

class GiveawayManager extends EventEmitter {
    client: Client;
    options: Options;
    constructor(client: Client, options: Options) {
        super();

        if (!client?.options) {
            throw new Error(`Client is a required option. (val=${client})`);
        }

        this.client = client;
        this.options = options;

        this.refresh(client);
        setInterval(() => {
            this.refresh(client);
        }, 4500);
    }

    async create(channel: TextBasedChannel, data: Giveaway) {

        let confirm = new ButtonBuilder()
            .setCustomId('confirm-entry-giveaway')
            .setEmoji('🎉')
            .setStyle(ButtonStyle.Primary);

        let gw = new EmbedBuilder()
            .setColor('#9a5af2')
            .setTitle(data.prize)
            .setDescription(`Ends: ${time((date.addMilliseconds(new Date(), data.duration)), 'R')} (${time((date.addMilliseconds(new Date(), data.duration)), 'D')})\nHosted by: <@${data.hostedBy}>\nEntries: **0**\nWinners: **${data.winnerCount}**`)
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
                expireIn: date.addMilliseconds(new Date(), data.duration),
                ended: false,
                entries: [],
                winners: [],
                isValid: true,
            }, response.id
        )
        return;
    };

    async addEntries(interaction: ButtonInteraction<CacheType>) {

        let members = db.GetGiveawayData(interaction.message.id).entries;

        if (members.includes(interaction.user.id)) {
            this.removeEntries(interaction);
            return;
        } else {

            db.AddEntries(interaction.message.id, interaction.user.id);
            await interaction.deferUpdate();

            let regex = /Entries: \*\*\d+\*\*/;

            let embedsToEdit = EmbedBuilder.from(interaction.message.embeds[0])
                .setDescription(interaction.message.embeds[0]?.description!
                    .replace(regex, `Entries: **${members.length + 1}**`)
                );

            await interaction.message.edit({ embeds: [embedsToEdit] });
        };
        return;
    };

    async removeEntries(interaction: ButtonInteraction<CacheType>) {

        let now_members = db.RemoveEntries(interaction.message.id, interaction.user.id)

        await interaction.reply({
            content: `${interaction.user} you have leave this giveaways !`,
            ephemeral: true
        });

        let regex = /Entries: \*\*\d+\*\*/;

        let embedsToEdit = EmbedBuilder.from(interaction.message.embeds[0])
            .setDescription(interaction.message.embeds[0]?.description!
                .replace(regex, `Entries: **${now_members.length}**`)
            );

        await interaction.message.edit({ embeds: [embedsToEdit] });
        return;
    }

    isValid(giveawayId: string): boolean {
        let fetch = db.GetGiveawayData(giveawayId)

        if (fetch) {
            return true
        } else {
            return false;
        }
    };

    isEnded(giveawayId: string): boolean {
        let fetch = db.GetGiveawayData(giveawayId)

        if (fetch.ended) {
            return true;
        } else {
            return false;
        }
    };

    end(client: Client, giveawayId: string) {

        let fetch = db.GetGiveawayData(giveawayId).isValid

        if (fetch && !db.GetGiveawayData(giveawayId).ended) {
            db.SetEnded(giveawayId, "End()");

            this.finnish(
                client,
                giveawayId,
                db.GetGiveawayData(giveawayId).guildId,
                db.GetGiveawayData(giveawayId).channelId,
            );
        } else return 404;
    };

    async finnish(client: Client, giveawayId: string, guildId: string, channelId: string) {
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

            let winner = this.selectWinners(
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

    selectWinners(fetch: Fetch, number: number): string[] {
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

    async reroll(client: Client, giveawayId: string) {

        let fetch = db.GetGiveawayData(giveawayId);

        let guild = await client.guilds.fetch(fetch.guildId);
        let channel = await guild.channels.fetch(fetch.channelId);

        let message = await (channel as BaseGuildTextChannel).messages.fetch(giveawayId).catch(async () => {
            db.DeleteGiveaway(giveawayId)
            return;
        }) as Message;

        let winner = this.selectWinners(
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

    async listEntries(interaction: ChatInputCommandInteraction, giveawayId: string) {
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

    async refresh(client: Client) {
        let drop_all_db = await db.GetAllGiveawaysData();

        for (let giveawayId in drop_all_db) {
            let now = new Date().getTime();
            let gwExp = new Date(drop_all_db[giveawayId].expireIn).getTime();
            let cooldownTime = now - gwExp;

            if (now >= gwExp) {
                this.finnish(
                    client,
                    giveawayId,
                    drop_all_db[giveawayId].guildId,
                    drop_all_db[giveawayId].channelId
                );
            };

            if (cooldownTime >= 345_600_000) {
                db.DeleteGiveaway(giveawayId)
            };
        }
    };
}

export { GiveawayManager };