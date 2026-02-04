/**
 * API Client Module
 * Handles HTTP communication with the EnergyGrid API
 */

const http = require('http');
const { generateSignature } = require('./signature');

const BASE_URL = 'http://localhost:3000';
const ENDPOINT = '/device/real/query';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Makes a POST request to the EnergyGrid API
 * @param {string[]} snList - Array of serial numbers to query
 * @returns {Promise<Object>} - API response data
 */
async function queryDevices(snList) {
    const timestamp = Date.now().toString();
    const signature = generateSignature(ENDPOINT, timestamp);
    const body = JSON.stringify({ sn_list: snList });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: ENDPOINT,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'timestamp': timestamp,
            'signature': signature
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${e.message}`));
                    }
                } else if (res.statusCode === 429) {
                    reject({ code: 429, message: 'Rate limited', retryable: true });
                } else {
                    reject({
                        code: res.statusCode,
                        message: data,
                        retryable: res.statusCode >= 500
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject({ code: 'NETWORK_ERROR', message: error.message, retryable: true });
        });

        req.write(body);
        req.end();
    });
}

/**
 * Makes a request with automatic retry logic for transient failures
 * @param {string[]} snList - Array of serial numbers to query
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>} - API response data
 */
async function queryDevicesWithRetry(snList, attempt = 1) {
    try {
        return await queryDevices(snList);
    } catch (error) {
        if (error.retryable && attempt < MAX_RETRIES) {
            console.log(`  ⚠️  Retry ${attempt}/${MAX_RETRIES} for batch after ${error.message}`);
            await sleep(RETRY_DELAY_MS * attempt); // Exponential backoff
            return queryDevicesWithRetry(snList, attempt + 1);
        }
        throw error;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    queryDevices,
    queryDevicesWithRetry,
    ENDPOINT
};
