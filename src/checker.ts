import {
    EmbedBuilder,
    CacheType,
    ButtonInteraction
} from "discord.js";

import {
    Data
} from "./types/Data";
import db from "./db.js";

async function isValid(giveawayId: number) {
    // let fetch = await db.get();

    // let dataDict: any = {};

    // for (let channelId in fetch) {
    //     for (let messageId in fetch[channelId]) {
    //         dataDict[messageId] = true;
    //     }
    // };

    // if (dataDict[giveawayId]) {
    //     return true;
    // };

    return false;
};

async function isEnded(giveawayId: number) {
    // let fetch = db.get(`GIVEAWAYS.${data.guildId}`);

    // let dataDict: any = {};

    // for (let channelId in fetch) {
    //     for (let messageId in fetch[channelId]) {
    //         dataDict[messageId] = fetch[channelId][messageId].ended;
    //     }
    // };

    // if (dataDict[giveawayId]) {
    //     return true;
    // };

    return false;
};
