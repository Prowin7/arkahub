/**
 * EnergyGrid Data Aggregator
 * Main entry point for fetching telemetry from 500 solar inverters
 */

const { queryDevicesWithRetry } = require('./api/client');
const RateLimiter = require('./api/rateLimiter');
const { generateSerialNumbers, createBatches, aggregateResults } = require('./business/deviceManager');

// Rate limiter with 1100ms interval (slightly over 1s for safety margin)
const rateLimiter = new RateLimiter(1100);

/**
 * Main function to orchestrate the data fetching process
 */
async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('       ⚡ EnergyGrid Data Aggregator - Starting ⚡');
    console.log('═══════════════════════════════════════════════════════════\n');

    const startTime = Date.now();

    // Step 1: Generate serial numbers
    console.log('📝 Step 1: Generating serial numbers...');
    const serialNumbers = generateSerialNumbers(500);
    console.log(`   Generated ${serialNumbers.length} serial numbers (${serialNumbers[0]} to ${serialNumbers[serialNumbers.length - 1]})\n`);

    // Step 2: Create batches
    console.log('📦 Step 2: Creating batches...');
    const batches = createBatches(serialNumbers);
    console.log(`   Created ${batches.length} batches of max 10 devices each\n`);

    // Step 3: Fetch data with rate limiting
    console.log('🌐 Step 3: Fetching data from API (this will take ~50 seconds)...');
    console.log('   Rate limit: 1 request per second\n');

    const results = [];
    const errors = [];

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchNumber = i + 1;
        const progress = ((batchNumber / batches.length) * 100).toFixed(1);

        try {
            // Use rate limiter to queue the request
            const response = await rateLimiter.enqueue(async () => {
                return queryDevicesWithRetry(batch);
            });

            if (response.data) {
                results.push(response.data);
                process.stdout.write(`\r   ✅ Batch ${batchNumber}/${batches.length} (${progress}%) - ${batch[0]} to ${batch[batch.length - 1]}`);
            }
        } catch (error) {
            errors.push({ batch: batchNumber, devices: batch, error: error.message || error });
            process.stdout.write(`\r   ❌ Batch ${batchNumber}/${batches.length} failed: ${error.message || 'Unknown error'}`);
        }
    }

    console.log('\n');

    // Step 4: Aggregate results
    console.log('📊 Step 4: Aggregating results...\n');
    const report = aggregateResults(results);

    // Calculate execution time
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Display summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                      📈 FINAL REPORT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Total Devices Queried:    ${report.summary.totalDevices}`);
    console.log(`   Online Devices:           ${report.summary.onlineDevices} (${report.summary.onlinePercentage})`);
    console.log(`   Offline Devices:          ${report.summary.offlineDevices}`);
    console.log(`   Total Power Output:       ${report.summary.totalPowerKW}`);
    console.log(`   Average Power per Device: ${report.summary.averagePowerKW}`);
    console.log(`   Execution Time:           ${executionTime} seconds`);
    console.log(`   Failed Batches:           ${errors.length}`);
    console.log(`   Report Generated At:      ${report.summary.generatedAt}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Show errors if any
    if (errors.length > 0) {
        console.log('⚠️  Failed Batches Details:');
        errors.forEach(e => {
            console.log(`   - Batch ${e.batch}: ${e.error}`);
        });
        console.log('');
    }

    // Sample output - first 5 devices
    console.log('📋 Sample Device Data (first 5):');
    console.log('-----------------------------------');
    report.devices.slice(0, 5).forEach(device => {
        console.log(`   ${device.sn}: ${device.power} | ${device.status} | ${device.last_updated}`);
    });
    console.log('   ...\n');

    console.log('✅ Data aggregation complete!\n');

    return report;
}

// Run the main function
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
