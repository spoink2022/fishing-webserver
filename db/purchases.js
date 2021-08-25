const config = require('./config.js');

async function ensureUserExists(userid) {
    let query = 'SELECT id FROM purchases WHERE userid=$1';
    let res = await config.pquery(query, [userid]);
    if (!res[0]) {
        let query = 'INSERT INTO purchases (userid) VALUES ($1)';
        await config.pquery(query, [userid]);
    }
    return;
}

module.exports.updateColumn = async function(userid, column, qt) {
    // check for user entry
    await ensureUserExists(userid);

    let query = `UPDATE purchases SET ${column}=${column}+$1 WHERE userid=$2`;
    await config.pquery(query, [qt, userid]);
    return;
}