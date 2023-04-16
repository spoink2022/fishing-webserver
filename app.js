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

let io;
if (PROD) {
  let httpsServer = https.createServer(credentials, app);
  httpsServer.listen(config.HTTPS_PORT);
  console.log(`Listening: https on port ${config.HTTPS_PORT}`);

  io = new Server(httpsServer);
} else {
  io = new Server(httpServer);
}

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

app.get('/suscheck', async (req, res) => {
  const data = await db.fishLog.getTimestamps(req.query.userid);
  res.send(parseSuscheckData(data));
});

function parseSuscheckData(data) {
  return data.map((t, i) => {
    return `${Math.floor(t/86400)} ${String(Math.floor((t%86400)/3600)).padStart(2, '0')}:${String(Math.floor((t%3600)/60)).padStart(2, '0')}:${String(Math.floor(t%60)).padStart(2, '0')}\
     ${i === data.length-1 ? '' : `(+${String(Math.floor((t - data[i+1])/60)).padStart(3, '0')}:${String((t-data[i+1])%60).padStart(2, '0')})`}`
  }).join('<br>');
}

app.get('/globalsuscheck', async (req, res) => {
  const data = await db.fishLog.getAllTimestamps();
  const suspiciousUsers = await conductGlobalSuscheck(data, req.query.chainsize, req.query.tolerance);
  res.send(
    `${req.query.chainsize} Chain Size\
    <br>${req.query.tolerance} Seconds Tolerance\
    <br>${suspiciousUsers.length} Suspicious Accounts\
    <br>${suspiciousUsers.map(userid => `<@${userid}>`).join('<br>')}`
    );
});

app.get('/cats', async (req, res) => {
  res.redirect(config.redirect_url);
});

async function conductGlobalSuscheck(data, CHAIN_SIZE, TOLERANCE) {
  // Remove intervals of less than 30 minutes
  let userid = data[data.length - 1].userid;
  for (let i=data.length-1; i>0; i--) {
    let entry = data[i];
    if (entry.userid !== userid) {
      userid = entry.userid;
    } else {
      if (entry.timestamp - data[i - 1].timestamp < 1800) {
        data.splice(i, 1);
      }
    }
  }

  // Start
  let suspiciousUsers = [];
  userid = data[0].userid;
  let suspicious = false;
  let timestamps = [];
  for (let entry of data) {
    if (entry.userid !== userid) {
      if (suspicious) {
        suspiciousUsers.push(userid);
      }
      userid = entry.userid;
      timestamps = [];
      suspicious = false;
    }

    timestamps.unshift(entry.timestamp);
    if (timestamps.length >= CHAIN_SIZE) {
      let interval = timestamps[0] - timestamps[1];
      let safe = false;
      for (let i=1; i<CHAIN_SIZE-1; i++) {
        //console.log(Math.abs((timestamps[i] - timestamps[i+1]) - interval));
        if (Math.abs((timestamps[i] - timestamps[i+1]) - interval) > TOLERANCE) {
          safe = true;
          break;
        }
      }
      if (!safe) {
        suspicious = true;
      }
    }
  }
  return suspiciousUsers;
}

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
  oneDayHost: 'supporter',
  oneWeekHost: 'big_supporter',
  customFish: 'custom_fish'
};

const PRODUCT_STAT_MAP = {
  oneDayHost: 'all_supporter',
  oneWeekHost: 'all_big_supporter',
  customFish: 'all_premium_server'
}

const PRICE_MAP = {
  oneDayHost: 1.5,
  oneWeekHost: 10,
  customFish: 20
}

async function fulfillOrder(session) {
  let purchases = session.client_reference_id.split('&');
  console.log('Fulfilling order...', purchases);
  
  let userid = purchases.shift(); // remove the first element and assign it to userid
  io.emit('purchase', { userid: userid, data: purchases });
  for (let purchase of purchases) {
    let product = purchase.split(':')[0];
    let qt = parseInt(purchase.split(':')[1]);
    await db.users.updateColumn(userid, PRODUCT_MAP[product], qt);
    await db.users.updateColumn(userid, PRODUCT_STAT_MAP[product], qt);
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
    Global.updateVariables(data.fish, data.kg);
    io.emit('catch', Global.getStats());
  });
});