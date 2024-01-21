import db from "./db.js";

function isValid(giveawayId: string): boolean {
    let fetch = db.GetGiveawayData(giveawayId)

    if (fetch) {
        return true
    } else {
        return false;
    }
};

function isEnded(giveawayId: string): boolean {
    let fetch = db.GetGiveawayData(giveawayId)

    if (fetch.ended) {
        return true;
    } else {
        return false;
    }
};

export {
    isEnded,
    isValid
};