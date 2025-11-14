const crypto = require('crypto');

// This generates a random string for the filename
const randomFileName = (bytes = 16) => crypto.randomBytes(bytes).toString('hex');

module.exports = { randomFileName };
