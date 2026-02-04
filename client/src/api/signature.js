/**
 * Signature Generator Module
 * Handles the cryptographic signature generation for API authentication
 */

const crypto = require('crypto');

const TOKEN = 'interview_token_123';

/**
 * Generates MD5 signature for API authentication
 * @param {string} url - The API endpoint URL
 * @param {number} timestamp - Current timestamp in milliseconds
 * @returns {string} - MD5 hash as hex string
 */
function generateSignature(url, timestamp) {
    const payload = url + TOKEN + timestamp;
    return crypto.createHash('md5').update(payload).digest('hex');
}

module.exports = {
    generateSignature,
    TOKEN
};
