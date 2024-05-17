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
    CacheType,
    ColorResolvable,
} from 'discord.js';

import { Giveaway, GiveawayCreateOptions } from './types/Giveaway';
import { Fetch } from './types/Data';

import { EventEmitter } from 'node:events';
import * as date from 'date-and-time';
import db from './db.js';

import { deepmerge } from 'deepmerge-ts';

interface GiveawaysManagerOptions {
    storage?: string,
    config?: {
        botsCanWin?: boolean,
        embedColor?: string,
        embedColorEnd?: string,
        reaction?: string,
        botName?: string,
        forceUpdateEvery?: number,
        endedGiveawaysLifetime?: number,
    },
};

class GiveawayManager extends EventEmitter {
    client: Client;
    options: GiveawaysManagerOptions;

    constructor(client: Client, options?: GiveawaysManagerOptions) {
        super();
        if (!client.options) {
            throw new Error(`Client is a required option. (val=${client})`);
        }

        this.options = deepmerge({
            storage: './giveaways',
            config: {
                botsCanWin: false,
                embedColor: '#9a5af2',
                embedColorEnd: '#2f3136',
                reaction: '🎉',
                botName: "Giveaway Bot",
                forceUpdateEvery: 3600,
                endedGiveawaysLifetime: 345_600_000,
            },
        }, options || {});

        db.InitFilePath(this.options.storage);

        client.on('interactionCreate', interaction => {
            if (interaction.isButton() && interaction.customId === "confirm-entry-giveaway") {
                this.addEntries(interaction);
            };
        });

        this.refresh(client);

        setInterval(() => {
            this.refresh(client);
        }, this.options.config.forceUpdateEvery);
    }

    public create(channel: TextBasedChannel, data: GiveawayCreateOptions): Promise<Message> {
        return new Promise(async (resolve, reject) => {
            try {
                let confirm = new ButtonBuilder()
                    .setCustomId('confirm-entry-giveaway')
                    .setEmoji(this.options.config.reaction)
                    .setStyle(ButtonStyle.Primary);

                let gw = new EmbedBuilder()
                    .setColor(this.options.config.embedColor as ColorResolvable)
                    .setTitle(data.prize)
                    .setDescription(`Ends: ${time((date.addMilliseconds(new Date(), data.duration, true)), 'R')} (${time((date.addMilliseconds(new Date(), data.duration, true)), 'D')})\nHosted by: <@${data.hostedBy}>\nEntries: **0**\nWinners: **${data.winnerCount}**`)
                    .setTimestamp((date.addMilliseconds(new Date(), data.duration, true)))
                    .setFooter({ text: this.options.config.botName })
                    .setImage(data.embedImageURL);

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
                        expireIn: date.addMilliseconds(new Date(), data.duration, true),
                        ended: false,
                        entries: [],
                        winners: [],
                        isValid: true,
                    }, response.id
                );

                resolve(response);
            } catch (error) {
                reject(error);
            }
        });
    };

    public async addEntries(interaction: ButtonInteraction<CacheType>) {

        let members = db.GetGiveawayData(interaction.message.id).entries;

        if (members.includes(interaction.user.id)) {
            await this.removeEntries(interaction);
            return;
        } else {

            await interaction.deferUpdate();
            let regex = /Entries: \*\*\d+\*\*/;

            let embedsToEdit = EmbedBuilder.from(interaction.message.embeds[0])
                .setDescription(interaction.message.embeds[0]?.description!
                    .replace(regex, `Entries: **${members.length + 1}**`)
                );

            await interaction.message.edit({ embeds: [embedsToEdit] });

            db.AddEntries(interaction.message.id, interaction.user.id);

            return;
        };
    };

    private async removeEntries(interaction: ButtonInteraction<CacheType>) {

        await interaction.reply({
            content: `${interaction.user} are you sure to leave this giveaways ?`,
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("giveaway-leave")
                            .setStyle(ButtonStyle.Danger)
                            .setLabel("Leave Giveaway")
                    )
            ],
            ephemeral: true
        });

        let collector = interaction.channel.createMessageComponentCollector({
            time: 30_000,
            filter: (i) => interaction.user.id === i.user.id
        });

        collector.on('collect', async (i: ButtonInteraction<CacheType>) => {
            if (i.customId === 'giveaway-leave') {

                let now_members = db.RemoveEntries(interaction.message.id, interaction.user.id);
                let regex = /Entries: \*\*\d+\*\*/;

                let embedsToEdit = EmbedBuilder.from(interaction.message.embeds[0])
                    .setDescription(interaction.message.embeds[0]?.description!
                        .replace(regex, `Entries: **${now_members.length}**`)
                    );

                await interaction.message.edit({ embeds: [embedsToEdit] });
                await interaction.editReply({ components: [], content: `<@${interaction.user.id}>, you have leave this giveaways !` })

                return;
            };
        });
    }

    public isValid(giveawayId: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                let fetch = db.GetGiveawayData(giveawayId);

                if (fetch) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (error) {
                reject(error);
            }
        });
    };

    public isEnded(giveawayId: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                let fetch = db.GetGiveawayData(giveawayId);

                if (fetch?.ended) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (error) {
                reject(error);
            }
        });
    };

    end(client: Client, giveawayId: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                let giveawayData = db.GetGiveawayData(giveawayId);

                if (giveawayData.isValid && !giveawayData.ended) {
                    db.SetEnded(giveawayId, "End()");
                    this.finish(
                        client,
                        giveawayId,
                        giveawayData.guildId,
                        giveawayData.channelId,
                    );
                    resolve();
                } else {
                    reject(new Error("Invalid Giveaway"));
                }
            } catch (error) {
                reject(error);
            }
        });
    };

    public async finish(client: Client, giveawayId: string, guildId: string, channelId: string) {
        let fetch = db.GetGiveawayData(giveawayId);

        if (!fetch.ended || fetch.ended === 'End()') {
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
                .setColor(this.options.config.embedColorEnd as ColorResolvable)
                .setTitle(fetch.prize)
                .setImage(fetch.embedImageURL)
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

    private selectWinners(fetch: Fetch, number: number): string[] {
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

    public reroll(client: Client, giveawayId: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                let fetch = await db.GetGiveawayData(giveawayId);

                let guild = await client.guilds.fetch(fetch.guildId);
                let channel = await guild.channels.fetch(fetch.channelId);

                let message = await (channel as BaseGuildTextChannel).messages.fetch(giveawayId).catch(async () => {
                    await db.DeleteGiveaway(giveawayId);
                    resolve();
                    return;
                }) as Message;

                let winner = this.selectWinners(
                    { entries: fetch.entries, winners: fetch.winners },
                    fetch.winnerCount
                );

                let winners = winner ? winner.map((winner: string) => `<@${winner}>`) : [];

                let embeds = new EmbedBuilder()
                    .setColor(this.options.config.embedColorEnd as ColorResolvable)
                    .setTitle(fetch.prize)
                    .setImage(fetch.embedImageURL)
                    .setDescription(`Ended: ${time(new Date(fetch.expireIn), 'R')} (${time(new Date(fetch.expireIn), 'D')})\nHosted by: <@${fetch.hostedBy}>\nEntries **${fetch.entries.length}**\nWinners: ${winners}`)
                    .setTimestamp()
                    .setFooter({ text: this.options.config.botName });

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
                }

                await db.SetWinners(giveawayId, winner || 'None');
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    public async listEntries(interaction: ChatInputCommandInteraction, giveawayId: string) {
        let fetch = db.GetGiveawayData(giveawayId);

        if (interaction.guildId === fetch.guildId) {
            var char: string[] = fetch.entries;

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
                    .setColor(this.options.config.embedColor as ColorResolvable)
                    .setTitle(pages[currentPage].title)
                    .setDescription(pages[currentPage].description)
                    .setFooter({ text: `${this.options.config.botName} | Page ${currentPage + 1}/${pages.length}`, iconURL: interaction.client.user?.displayAvatarURL() })
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

    private refresh(client: Client) {
        let drop_all_db = db.GetAllGiveawaysData();

        for (let giveawayId in drop_all_db) {
            let now = new Date().getTime();
            let gwExp = new Date(drop_all_db[giveawayId].giveawayData.expireIn).getTime();
            let cooldownTime = now - gwExp;

            if (now >= gwExp) {
                this.finish(
                    client,
                    drop_all_db[giveawayId].giveawayId,
                    drop_all_db[giveawayId].giveawayData.guildId,
                    drop_all_db[giveawayId].giveawayData.channelId
                );
            };

            if (cooldownTime >= this.options.config.endedGiveawaysLifetime) {
                db.DeleteGiveaway(drop_all_db[giveawayId].giveawayId)
            };
        }
    };

    public getGiveawayData(giveawayId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                let fetch = await db.GetGiveawayData(giveawayId);

                if (fetch) {
                    resolve(fetch);
                } else {
                    reject(new Error("Giveaway non trouvé"));
                }
            } catch (error) {
                reject(error);
            }
        });
    };

    public getAllGiveawayData() {
        return db.GetAllGiveawaysData();
    }

    public delete(giveawayId: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                if (await this.isValid(giveawayId)) {
                    await db.DeleteGiveaway(giveawayId);
                    resolve(true);
                } else {
                    reject(new Error("Giveaway non valide"));
                }
            } catch (error) {
                reject(error);
            }
        });
    };

}
export { GiveawayManager };