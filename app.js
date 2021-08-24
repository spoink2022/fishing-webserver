const PROD = false;

const Global = require('./global.js');
const config = require('./private/config.json');

const fetch = require('node-fetch');

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

const favicon = require('serve-favicon');

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

app.use(favicon('public/images/favicon.ico'));

app.use('/shop', async (req, res, next) => {
  const code = req.query.code;
  if (code) {
    try {
			const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
				method: 'POST',
				body: new URLSearchParams({
					client_id: config.clientId,
					client_secret: config.clientSecret,
					code,
					grant_type: 'authorization_code',
					redirect_uri: `${config.domain}/shop`,
					scope: 'identify',
				}),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});

			const oauthData = await oauthResult.json();

      const userResultRaw = await fetch('https://discord.com/api/users/@me', {
        headers: {
          authorization: `${oauthData.token_type} ${oauthData.access_token}`
        }
      });
      const userResult = await userResultRaw.json();

			res.locals.user = userResult;
		} catch (error) {
			// NOTE: An unauthorized token will not throw an error;
			// it will return a 401 Unauthorized response in the try block above
			console.error(error);
		}
  }
  next();
});

app.get('/', async (req, res) => {
  const stats = Global.getStats();
  res.render('main.ejs', {fish: stats.fishCaught, weight: stats.tonsCaught});
});

app.get('/commands', (req, res) => {
  console.log(res.locals);
  res.render('commands.ejs', {preset: null});
});
app.get('/commands/*', (req, res) => {
  res.render('commands.ejs', {preset: req.params['0']});
});

app.get('/start', (req, res) => {
  res.render('tutorial.ejs');
});

app.get('/advanced', (req, res) => {
  res.render('advanced.ejs');
});

app.get('/shop', (req, res) => {
  let user = null;
  if (res.locals.user && res.locals.user.id) {
    let userResult = res.locals.user;
    user = {
      id: userResult.id,
      tag: userResult.username + '#' + userResult.discriminator,
      avatarUrl: `https://cdn.discordapp.com/avatars/${userResult.id}/${userResult.avatar}.png`
    };
  }
  console.log(user);
  res.render('shop.ejs', {user: user});
});

let httpServer = http.createServer(app);
httpServer.listen(config.HTTP_PORT);
console.log(`Listening: http on port ${config.HTTP_PORT}`);    

if (PROD) {
  let httpsServer = https.createServer(credentials, app);
  httpsServer.listen(config.HTTPS_PORT);
  console.log(`Listening: https on port ${config.HTTPS_PORT}`);
}