const db = require('./db');

let fishCaught;
let tonsCaught;

updateVariables();

setInterval(updateVariables, 300000);

async function updateVariables() {
    fishCaught = await db.stats.fetchFishCaught();
    tonsCaught = await db.stats.fetchTonsCaught();
    tonsCaught = Math.round(tonsCaught/1000) / 1000;
}

module.exports.getStats = function() {
    return {
        fishCaught: fishCaught,
        tonsCaught: tonsCaught
    };
}