import { User } from "discord.js";

let path = `${__dirname}/giveaways`;

class db {

    AddEntries(giveawayId: string, user: string): any {

    }

    RemoveEntries(giveawayId: string, user: string): any {
        let members = this.GetEntries(giveawayId);
        
        function arraySub(arr: Array<string>, value: string) {
            return arr.filter(function (toSub) {
                return toSub != value;
            });
        };

        arraySub(members, user)
        // do something with arraySub
    }

    GetEntries(giveawayId: string): string[] {
        const entries: string[] = ["Entry1", "Entry2", "Entry3"];
        return entries;
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