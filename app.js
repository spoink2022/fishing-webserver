const Global = require('./global.js');
const config = require('./private/config.json');

const fs = require('fs');
const http = require('http');
const https = require('https');
let privateKey  = fs.readFileSync('/etc/letsencrypt/live/bigtuna.xyz/privkey.pem', 'utf8');
let certificate = fs.readFileSync('/etc/letsencrypt/live/bigtuna.xyz/chain.pem', 'utf8');

let credentials = {key: privateKey, cert: certificate};
const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'))


app.get('/', (req, res) => {
    const stats = Global.getStats();
    res.render('main.ejs', {fish: stats.fishCaught, weight: stats.tonsCaught});
});

let httpServer = http.createServer(app);
let httpsServer = https.createServer(credentials, app);

httpServer.listen(config.HTTP_PORT);
console.log(`Listening: http on port ${config.HTTP_PORT}`);    


httpsServer.listen(config.HTTPS_PORT);
console.log(`Listening: https on port ${config.HTTPS_PORT}`);
