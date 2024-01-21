import {
    EmbedBuilder,
    CacheType,
    ButtonInteraction
} from "discord.js";

import db from "./db.js";

async function AddEntries(interaction: ButtonInteraction<CacheType>) {

    let members = db.GetEntries(interaction.message.id);

    if (members.includes(interaction.user.id)) {
        RemoveEntries(interaction);
        return;
    } else {

        db.AddEntries(interaction.message.id, interaction.user.id);
        await interaction.deferUpdate();

        let regex = /Entries: \*\*\d+\*\*/;

        let embedsToEdit = EmbedBuilder.from(interaction.message.embeds[0])
            .setDescription(interaction.message.embeds[0]?.description!
                .replace(regex, `Entries: **${members.length + 1}**`)
            );

        await interaction.message.edit({ embeds: [embedsToEdit] });
    };
    return;
};

async function RemoveEntries(interaction: ButtonInteraction<CacheType>) {

    let now_members = db.RemoveEntries(interaction.message.id, interaction.user.id)

    await interaction.reply({
        content: `${interaction.user} you have leave this giveaways !`,
        ephemeral: true
    });

    let regex = /Entries: \*\*\d+\*\*/;

    let embedsToEdit = EmbedBuilder.from(interaction.message.embeds[0])
        .setDescription(interaction.message.embeds[0]?.description!
            .replace(regex, `Entries: **${now_members.length}**`)
        );

    await interaction.message.edit({ embeds: [embedsToEdit] });
    return;
};

export default {
    RemoveEntries,
    AddEntries
};