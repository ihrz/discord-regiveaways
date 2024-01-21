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

    // Reroll,
    ListEntries
};