const Global = require('./global.js');
const db = require('./db');
const config = require('./private/config.json');
const PROD = config.PROD;

const fetch = require('node-fetch');
const { Server, Socket } = require('socket.io');
const { sendUpdatedMainPageStats } = require('./lib/websocket.js');

const fs = require('fs');
const http = require('http');
const https = require('https');

const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();

const stripe = require('stripe')(config.stripe.secretKey);

if (PROD) {
  var privateKey  = fs.readFileSync('/etc/letsencrypt/live/bigtuna.xyz/privkey.pem', 'utf8');
  var certificate = fs.readFileSync('/etc/letsencrypt/live/bigtuna.xyz/cert.pem', 'utf8');
  var chain = fs.readFileSync('/etc/letsencrypt/live/bigtuna.xyz/chain.pem', 'utf8');

  var credentials = {key: privateKey, cert: certificate, ca: chain};
}

// HTTPS CONFIG, WEBSOCKETS
let httpServer = http.createServer(app);
httpServer.listen(config.HTTP_PORT);
console.log(`Listening: http on port ${config.HTTP_PORT}`);    

if (PROD) {
  let httpsServer = https.createServer(credentials, app);
  httpsServer.listen(config.HTTPS_PORT);
  console.log(`Listening: https on port ${config.HTTPS_PORT}`);
}

const io = new Server(httpServer);

// EXPRESS
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.json({verify: (req,res,buf) => { req.rawBody = buf }}));

app.set('view engine', 'ejs');
app.use(express.static('public'));

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

// GET REQUESTS
app.get('/', async (req, res) => {
  const stats = Global.getStats();
  res.render('main.ejs', {fish: stats.fishCaught, weight: stats.tonsCaught});
});

app.get('/commands', (req, res) => {
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
  let user = {userid: null, username: null, avatarUrl: null};
  if (res.locals.user && res.locals.user.id) {
    let userResult = res.locals.user;
    user = {
      userid: userResult.id,
      username: userResult.username,
      avatarUrl: `https://cdn.discordapp.com/avatars/${userResult.id}/${userResult.avatar}.png`
    };
  }
  res.render('shop.ejs', {userid: user.userid, username: user.username, avatarUrl: user.avatarUrl, discordAuthUrl: config.discord.authUrl});
});

app.get('/success', (req, res) => {
  res.render('success.ejs');
});

// POST REQUESTS
app.post('/create-checkout-session', async (req, res) => {
  if (!req.body.userid) {
    return res.redirect('/shop');
  }

  const userid = req.body.userid;

  let line_items = [], line_items_str = "";
  for (let[key, value] of Object.entries(req.body)) {
    value = parseInt(value);
    if (key === 'userid' || value <= 0) {continue;}
    line_items.push({price: config.stripe.prices[key], quantity: value});
    line_items_str += `&${key}:${value}`;
  }

  if (line_items.length === 0) {
    return res.redirect('/shop');
  }

  const session = await stripe.checkout.sessions.create({
    line_items: line_items,
    payment_method_types: [
      'card'
    ],
    mode: 'payment',
    success_url: `${config.domain}/success`,
    cancel_url: `${config.domain}/shop`,
    client_reference_id: `${userid}${line_items_str}`// ALL INFO TO PROCESS
  });

  res.redirect(303, session.url)
});

const PRODUCT_MAP = {
  oneDayHost: 'one_day_host',
  oneWeekHost: 'one_week_host',
  customFish: 'custom_fish'
};

async function fulfillOrder(session) {
  let purchases = session.client_reference_id.split('&');
  console.log('Fulfilling order...', purchases);
  
  let userid = purchases.shift(); // remove the first element and assign it to userid
  for (let purchase of purchases) {
    let product = purchase.split(':')[0];
    let qt = parseInt(purchase.split(':')[1]);
    await db.purchases.updateColumn(userid, PRODUCT_MAP[product], qt);
  }
}

app.post('/webhook', bodyParser.raw({type: 'application/json'}), async (req, res) => {
  const payload = req.body;

  // Handle the checkout.session.completed event
  if (payload.type === 'checkout.session.completed') {
    const session = payload.data.object;

    // Fulfill the purchase...
    fulfillOrder(session);
  }

  res.json({received: true});
});

// WEBSOCKET HANDLING
io.on('connection', (socket) => {
  socket.on('catch', (data) => {
    console.log('fish catch!');
    Global.setVariables(data.fish, data.tons);
    io.emit('catch', data);
  });
});