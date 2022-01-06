const db = require('./db');

let fishCaught;
let tonsCaught;

pullVariables();

//setInterval(updateVariables, 300000);

async function pullVariables() {
    fishCaught = parseInt(await db.users.fetchTotalFishCaught());
    tonsCaught = parseFloat(await db.users.fetchTotalWeightCaught());
    tonsCaught = Math.round(tonsCaught * 1000) / 1000;
    console.log(fishCaught, tonsCaught);
}

module.exports.updateVariables = async function(fish, kg) {
    console.log(fish, kg);
    fishCaught += fish;
    tonsCaught += kg/1000;
}

module.exports.getStats = function() {
    return {
        fishCaught: parseInt(fishCaught),
        tonsCaught: tonsCaught
    };
}