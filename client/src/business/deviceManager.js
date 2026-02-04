/**
 * Device Manager Module
 * Handles business logic for device data aggregation
 */

const BATCH_SIZE = 10;

/**
 * Generates a list of dummy serial numbers
 * @param {number} count - Number of serial numbers to generate
 * @returns {string[]} - Array of serial numbers
 */
function generateSerialNumbers(count = 500) {
    const serialNumbers = [];
    for (let i = 0; i < count; i++) {
        const paddedNumber = String(i).padStart(3, '0');
        serialNumbers.push(`SN-${paddedNumber}`);
    }
    return serialNumbers;
}

/**
 * Splits an array into batches of specified size
 * @param {Array} array - Array to split
 * @param {number} batchSize - Maximum size of each batch
 * @returns {Array[]} - Array of batches
 */
function createBatches(array, batchSize = BATCH_SIZE) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
        batches.push(array.slice(i, i + batchSize));
    }
    return batches;
}

/**
 * Aggregates device results into a comprehensive report
 * @param {Array} results - Array of device data from API responses
 * @returns {Object} - Aggregated report
 */
function aggregateResults(results) {
    const flatResults = results.flat();

    // Calculate statistics
    const totalDevices = flatResults.length;
    const onlineDevices = flatResults.filter(d => d.status === 'Online').length;
    const offlineDevices = flatResults.filter(d => d.status === 'Offline').length;

    // Calculate total power (extract numeric value)
    const totalPower = flatResults.reduce((sum, device) => {
        const power = parseFloat(device.power);
        return sum + (isNaN(power) ? 0 : power);
    }, 0);

    return {
        summary: {
            totalDevices,
            onlineDevices,
            offlineDevices,
            onlinePercentage: ((onlineDevices / totalDevices) * 100).toFixed(2) + '%',
            totalPowerKW: totalPower.toFixed(2) + ' kW',
            averagePowerKW: (totalPower / totalDevices).toFixed(2) + ' kW',
            generatedAt: new Date().toISOString()
        },
        devices: flatResults
    };
}

module.exports = {
    generateSerialNumbers,
    createBatches,
    aggregateResults,
    BATCH_SIZE
};
