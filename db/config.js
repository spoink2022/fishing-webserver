const { Pool } = require('pg');
const config = require('../private/config.json');

const pool = new Pool ({
    user: config.db.user,
    host: config.db.host,
    database: config.db.database,
    password: config.db.password,
    port: config.db.port
});

module.exports.pquery = async function(text, params) {
    //const start = Date.now();
    const result = await pool.query(text, params);
    //const duration = Date.now() - start;
    //console.log('executed query', {text, duration, rows: result.rowCount});
    return result.rows;
};