const config = require('./config.js');

module.exports.fetchTotalFishCaught = async function() {
    let query = 'SELECT SUM(fish_caught) FROM users';
    let fishCaught = (await config.pquery(query))[0].sum;
    return fishCaught;
}

module.exports.fetchTotalWeightCaught = async function() {
    let query = 'SELECT SUM(weight_caught) FROM users';
    let weightCaught = (await config.pquery(query))[0].sum / 1000000;
    return weightCaught; // tons
}

module.exports.updateColumn = async function(userid, column, amount) {
    let query = `UPDATE users SET ${column}=${column}+$1 WHERE userid=$2`;
    await config.pquery(query, [amount, userid]);
    return;
}