const crypto = require('crypto');

// Nodejs support openssl algorithm
const CIPHER_ALGORITHM = 'aes256'; // aes256 is aes256-cbc

const createCipher = (password) => crypto.createCipher(CIPHER_ALGORITHM, password);

const createDecipher = (password) => crypto.createDecipher(CIPHER_ALGORITHM, password);

module.exports = {
    createCipher,
    createDecipher
};
