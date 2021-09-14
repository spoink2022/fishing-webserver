async function sendUpdatedMainPageStats(io, fishCaught, tonsCaught) {
    io.emit('newStats', { fishCaught: fishCaught, tonsCaught: tonsCaught });
}

module.exports = {
    sendUpdatedMainPageStats: sendUpdatedMainPageStats
};