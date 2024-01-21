import { Giveaway } from "./types/GiveawayData";
import { User } from "discord.js";

let path = `${__dirname}/giveaways`;

class db {

    AddEntries(giveawayId: string, user: string){

    }

    RemoveEntries(giveawayId: string, user: string): string[] {
        let members = this.GetEntries(giveawayId);

        function arraySub(arr: Array<string>, value: string) {
            return arr.filter(function (toSub) {
                return toSub != value;
            });
        };

        let now_members = arraySub(members, user)
        // do something with arraySub

        return now_members
    }

    GetEntries(giveawayId: string): string[] {
        const entries: string[] = ["Entry1", "Entry2", "Entry3"];
        return entries;
    }

    IsValid(giveawayId: string): boolean {
        // todo: the logic
        const isValid: boolean = true;
        return isValid;
    }

    Create(giveaway: Giveaway, giveawayId: string) {
    }

    get(params: string): any {
    }

    set(params: string, to: any): any {
    }

    push(params: string, to: any): any {
    }

    delete(params: string): any {
    }
};

export default new db();