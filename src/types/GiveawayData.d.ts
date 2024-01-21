import { User } from "discord.js";

export interface Giveaway {
    duration: number;
    prize: string;
    winnerCount: number;
    hostedBy: User
    ended?: boolean
}