const PROD = true;

const Global = require('./global.js');
const config = require('./private/config.json');

const fs = require('fs');
const http = require('http');
const https = require('https');

if (PROD) {
  var privateKey  = fs.readFileSync('/etc/letsencrypt/live/bigtuna.xyz/privkey.pem', 'utf8');
  var certificate = fs.readFileSync('/etc/letsencrypt/live/bigtuna.xyz/cert.pem', 'utf8');

  var credentials = {key: privateKey, cert: certificate};
}

const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'))

if (PROD) {
  app.use(function(req, res, next) {
      if(!req.secure) {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
      }
      next();
  });
}

app.get('/', (req, res) => {
  const stats = Global.getStats();
  res.render('main.ejs', {fish: stats.fishCaught, weight: stats.tonsCaught});
});

app.get('/commands', (req, res) => {
  res.render('commands.ejs');
});

app.get('/start', (req, res) => {
  res.render('tutorial.ejs');
});

let httpServer = http.createServer(app);
httpServer.listen(config.HTTP_PORT);
console.log(`Listening: http on port ${config.HTTP_PORT}`);    

if (PROD) {
  let httpsServer = https.createServer(credentials, app);
  httpsServer.listen(config.HTTPS_PORT);
  console.log(`Listening: https on port ${config.HTTPS_PORT}`);
}