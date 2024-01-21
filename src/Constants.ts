const giveawaysManagerOptions = {
    storage: './giveaways.json',
    config: {
        botsCanWin: false,
        embedColor: '#FF0000',
        embedColorEnd: '#000000',
        reaction: '🎉',
        botName: "Giveaway Bot",
        forceUpdateEvery: 3600,
        endedGiveawaysLifetime: 1_600_000,
    },
} as const;

type GiveawaysManagerOptions = typeof giveawaysManagerOptions;

export { giveawaysManagerOptions, GiveawaysManagerOptions };