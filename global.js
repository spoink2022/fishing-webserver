const db = require('./db');

let fishCaught;
let tonsCaught;

updateVariables();

//setInterval(updateVariables, 300000);

async function updateVariables() {
    fishCaught = await db.stats.fetchFishCaught();
    tonsCaught = await db.stats.fetchTonsCaught();
    tonsCaught = Math.round(tonsCaught/1000) / 1000;
}

module.exports.setVariables = async function(fish, tons) {
    fishCaught = fish;
    tonsCaught = tons;
}

module.exports.getStats = function() {
    return {
        fishCaught: parseInt(fishCaught),
        tonsCaught: tonsCaught
    };
}