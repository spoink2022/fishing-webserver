const config = require('./config.js');

module.exports.fetchFishCaught = async function() {
    const fishCaught = (await config.pquery('SELECT SUM(fish_caught) FROM stats'))[0].sum;
    return fishCaught;
}

module.exports.fetchTonsCaught = async function() {
    const weightCaught = (await config.pquery('SELECT SUM(weight_caught) FROM stats'))[0].sum;
    return weightCaught;
}