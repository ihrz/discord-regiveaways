export interface Data {
    guildId?: string;
    messageId?: string;
}

export interface Fetch {
    entries: string | any[];
    winners: string | string[];
}

export interface Options {
    storage: string,
    default?: {
        botsCanWin: boolean,
        embedColor: string,
        embedColorEnd: string,
        reaction: string
    }
}