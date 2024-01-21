const giveawaysManagerOptions = {
    storage: './giveaways.json',
    config: {
        botsCanWin: false,
        embedColor: '#9a5af2',
        embedColorEnd: '#2f3136',
        reaction: '🎉',
        botName: "Giveaway Bot",
        forceUpdateEvery: 3600,
        endedGiveawaysLifetime: 345_600_000,
    },
} as const;

type GiveawaysManagerOptions = typeof giveawaysManagerOptions;

export { giveawaysManagerOptions, GiveawaysManagerOptions };