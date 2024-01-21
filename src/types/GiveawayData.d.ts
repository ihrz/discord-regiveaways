interface Giveaway {
    isValid: boolean;
    guildId: string;
    channelId: string;
    entries: string[];
    duration?: number;
    prize: string;
    winnerCount: number;
    hostedBy: string;
    ended?: boolean | string;
    expireIn: Date;
    winners: string[] | string;
}

export {
    Giveaway
};