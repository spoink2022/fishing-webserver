const Global = require('./global.js');
const config = require('./private/config.json');

const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'))


app.get('/', (req, res) => {
    const stats = Global.getStats();
    res.render('main.ejs', {fish: stats.fishCaught, weight: stats.tonsCaught});
});

const server = app.listen(config.PORT, () => {
    console.log(`Listening on port ${config.PORT}`);
});