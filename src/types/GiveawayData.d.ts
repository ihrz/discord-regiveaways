interface Giveaway {
    isValid: boolean;
    guildId: string;
    channelId: string;

    entries: string[];
    winners: string[] | string;
    winnerCount: number;

    prize: string;
    hostedBy: string;
    ended?: boolean | string;

    expireIn: Date;
    duration?: number;

    embedImageURL?: string;
}

export {
    Giveaway
};