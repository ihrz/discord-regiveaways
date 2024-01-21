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
    let drop_all_db = await db.GetAllGiveawaysData();

    for (let data in drop_all_db) {
        let now = new Date().getTime();
        let gwExp = new Date(drop_all_db[data].expireIn).getTime();
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
            // db.delete(`GIVEAWAYS.${guildId}.${channelId}.${messageId}`);
        };
    }
};

export {
    GiveawaysManager_Init,
};