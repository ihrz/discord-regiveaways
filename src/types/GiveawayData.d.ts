import { User } from "discord.js";

interface Giveaway {
    isValid: boolean;
    guildId: string;
    channelId: string;
    entries: string[];
    duration?: number;
    prize: string;
    winnerCount: number;
    hostedBy: User;
    ended?: boolean | string;
    expireIn: number;
    winners: string[];
}

export {
    Giveaway
};