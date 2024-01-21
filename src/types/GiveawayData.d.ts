import { User } from "discord.js";

interface Giveaway {
    isValid: boolean;
    entries: string[];
    duration?: number;
    prize: string;
    winnerCount: number;
    hostedBy: User;
    ended?: boolean;
    expireIn: number;
}

export {
    Giveaway
};