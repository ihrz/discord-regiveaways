import { Giveaway } from "./types/GiveawayData";
import * as fs from 'fs';

let path = `${__dirname}/giveaways`;
if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
};

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

    GetAllGiveawaysData(): Giveaway[] {
        const giveawayFiles = fs.readdirSync(path);
        const allGiveaways: Giveaway[] = [];

        giveawayFiles.forEach((file) => {
            const giveawayId = file.replace('.json', '');
            const giveawayData = this.readGiveawayFile(giveawayId);
            if (giveawayData) {
                allGiveaways.push(giveawayData);
            }
        });

        return allGiveaways;
    }

    DeleteGiveaway(giveawayId: string) {
        const filePath = this.getFilePath(giveawayId);

        try {
            fs.unlinkSync(filePath);
            console.log(`Giveaway ${giveawayId} deleted successfully.`);
        } catch (error) {
            console.error(`Error deleting giveaway ${giveawayId}: ${error}`);
        }
    }
};

export default new db();
