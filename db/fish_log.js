const config = require('./config.js');

module.exports.getTimestamps = async function(userid) {
    let query = 'SELECT id, timestamp FROM fish_log WHERE userid=$1 ORDER BY id DESC';
    return (await config.pquery(query, [userid])).map(obj => obj.timestamp);
}