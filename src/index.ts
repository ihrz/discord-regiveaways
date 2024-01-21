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
import { Finnish } from './eventManager';

function GiveawaysManager_Init(client: Client) {
    Refresh(client);

    setInterval(() => {
        Refresh(client);
    }, 4500);
};

async function Refresh(client: Client) {
    let drop_all_db = await db.GetAllGiveawaysData();

    for (let giveawayId in drop_all_db) {
        let now = new Date().getTime();
        let gwExp = new Date(drop_all_db[giveawayId].expireIn).getTime();
        let cooldownTime = now - gwExp;

        if (now >= gwExp) {
            Finnish(
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

export {
    GiveawaysManager_Init,
    Refresh
};