console.log("Polyfilling crypto to make uuid work with jsdom")

var nodeCrypto = require('crypto');

global.crypto = {
    getRandomValues: function(buffer: T) { return nodeCrypto.randomFillSync(buffer);}
};
