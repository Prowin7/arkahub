/**
 * Rate Limiter Module
 * Implements a queue-based rate limiter to enforce 1 request per second
 */

class RateLimiter {
    constructor(minIntervalMs = 1000) {
        this.minIntervalMs = minIntervalMs;
        this.lastRequestTime = 0;
        this.queue = [];
        this.isProcessing = false;
    }

    /**
     * Adds a request to the queue and processes it respecting rate limits
     * @param {Function} requestFn - Async function that makes the API call
     * @returns {Promise} - Resolves with the result of the request
     */
    async enqueue(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            this.processQueue();
        });
    }

    /**
     * Processes queued requests with proper rate limiting
     */
    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const { requestFn, resolve, reject } = this.queue.shift();

            // Calculate wait time to respect rate limit
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            const waitTime = Math.max(0, this.minIntervalMs - timeSinceLastRequest);

            if (waitTime > 0) {
                await this.sleep(waitTime);
            }

            try {
                this.lastRequestTime = Date.now();
                const result = await requestFn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }

        this.isProcessing = false;
    }

    /**
     * Utility sleep function
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = RateLimiter;
