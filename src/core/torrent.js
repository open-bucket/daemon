const Webtorrent = require('webtorrent');
 
const announceUrl = 'http://localhost:8080/announce';
 
let client;
 
function createTorrentClient() {
    if (!client) {
        client = new Webtorrent({ dht: false });
    }
}
 
exports.seed = (stream) => {
    createTorrentClient();
    return new Promise((resolve) => {
        client.seed(stream, { announce: [announceUrl] }, (torrent)=>{
            resolve(torrent.magnetURI);
        });
    });
};