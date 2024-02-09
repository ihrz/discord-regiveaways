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
};

interface GiveawayCreateOptions {
    duration: number;
    prize: string;
    winnerCount: number;
    hostedBy: string;
    embedImageURL: string | null;
};

export {
    Giveaway,
    GiveawayCreateOptions
};