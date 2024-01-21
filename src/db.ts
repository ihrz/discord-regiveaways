import * as fs from 'fs';
import { Giveaway } from "./types/GiveawayData";
import { Guild, User } from "discord.js";

let path = `${__dirname}/giveaways`;

class db {

    private getFilePath(giveawayId: string): string {
        return `${path}/${giveawayId}.json`;
    }

    private readGiveawayFile(giveawayId: string): Giveaway | null {
        const filePath = this.getFilePath(giveawayId);
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data) as Giveaway;
        } catch (error) {
            return null;
        }
    }

    private writeGiveawayFile(giveawayId: string, data: Giveaway) {
        const filePath = this.getFilePath(giveawayId);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    AddEntries(giveawayId: string, user: string) {
        const giveaway = this.readGiveawayFile(giveawayId);
        if (giveaway) {
            giveaway.entries.push(user);
            this.writeGiveawayFile(giveawayId, giveaway);
        }
    }

    RemoveEntries(giveawayId: string, userId: string): string[] {
        const giveaway = this.readGiveawayFile(giveawayId);
        if (giveaway) {
            giveaway.entries = giveaway.entries.filter((entry: string) => entry !== userId);
            this.writeGiveawayFile(giveawayId, giveaway);
            return giveaway.entries;
        }
        return [];
    }

    GetGiveawayData(giveawayId: string): Giveaway | null {
        const giveaway = this.readGiveawayFile(giveawayId);
        return giveaway ? giveaway : null;
    }

    Create(giveaway: Giveaway, giveawayId: string) {
        this.writeGiveawayFile(giveawayId, giveaway);
    }

    SetEnded(giveawayId: string, state: boolean | string) {
        const giveaway = this.readGiveawayFile(giveawayId);
        giveaway.ended = state;
        return 'OK';
    }

    SetWinners(giveawayId: string, winners: string[] | string) {
        const giveaway = this.readGiveawayFile(giveawayId);
        giveaway.winners = winners;
        return 'OK';
    }

    get(params: string): any {
        // Implémentez la logique pour récupérer les données
    }

    set(params: string, to: any): any {
        // Implémentez la logique pour définir les données
    }

    delete(params: string): any {
        // Implémentez la logique pour supprimer des données
    }
}

export default new db();
