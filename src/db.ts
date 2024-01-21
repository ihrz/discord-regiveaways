import * as fs from 'fs';
import { Giveaway } from "./types/GiveawayData";
import { User } from "discord.js";

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

    GetEntries(giveawayId: string): string[] {
        const giveaway = this.readGiveawayFile(giveawayId);
        return giveaway ? giveaway.entries : [];
    }

    IsValid(giveawayId: string): boolean {
        const giveaway = this.readGiveawayFile(giveawayId);
        return giveaway ? giveaway.isValid : false;
    }

    IsEnded(giveawayId: string): boolean {
        const giveaway = this.readGiveawayFile(giveawayId);
        return giveaway ? giveaway.ended : false;
    }

    Create(giveaway: Giveaway, giveawayId: string) {
        this.writeGiveawayFile(giveawayId, giveaway);
    }

    SetEnded(giveawayId: string, state: boolean) {
        const giveaway = this.readGiveawayFile(giveawayId);
        giveaway.ended = state;
        return 'OK';
    }

    SetWinners(giveawayId: string, winners: string[]) {
    }

    get(params: string): any {
        // Implémentez la logique pour récupérer les données
    }

    set(params: string, to: any): any {
        // Implémentez la logique pour définir les données
    }

    push(params: string, to: any): any {
        // Implémentez la logique pour ajouter des données à un tableau
    }

    delete(params: string): any {
        // Implémentez la logique pour supprimer des données
    }
}

export default new db();
