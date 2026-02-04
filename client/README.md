# EnergyGrid Data Aggregator - Client Solution

A robust Node.js client application that fetches real-time telemetry data from 500 solar inverters while respecting strict rate limits and security protocols.

## 📋 Project Structure

```
client/
├── package.json          # Project dependencies (none - pure Node.js)
├── README.md             # This file
└── src/
    ├── index.js          # Main entry point & orchestration
    ├── api/
    │   ├── client.js     # HTTP client with retry logic
    │   ├── rateLimiter.js # Queue-based rate limiter
    │   └── signature.js  # MD5 signature generator
    └── business/
        └── deviceManager.js # Business logic (batching, aggregation)
```

## 🚀 How to Run

### Prerequisites
- Node.js (v14 or higher)
- Mock API server running on port 3000

### Step 1: Start the Mock Server
```bash
cd mock-api  # or project root
npm install
npm start
```

### Step 2: Run the Client
```bash
cd client
npm start
```

Or directly:
```bash
node client/src/index.js
```

## 🔧 Approach & Design Decisions

### Rate Limiting Strategy
- **Queue-based Rate Limiter**: Implemented a custom `RateLimiter` class that queues all requests and processes them sequentially with a minimum interval of 1100ms between requests.
- **Why 1100ms instead of 1000ms?**: Added a 100ms safety buffer to account for timing inconsistencies and ensure we never hit the 429 rate limit.
- **Sequential Processing**: Unlike concurrent approaches, this ensures strict ordering and prevents race conditions.

### Request Batching
- **Batch Size**: 10 devices per request (maximum allowed by API)
- **50 Batches Total**: 500 devices / 10 per batch = 50 requests
- **Expected Duration**: ~55 seconds (50 requests × 1.1s interval)

### Error Handling & Retry Logic
- **Automatic Retries**: Up to 3 retries for transient failures (429, 5xx, network errors)
- **Exponential Backoff**: Retry delay increases with each attempt (2s, 4s, 6s)
- **Graceful Degradation**: Failed batches are logged but don't stop the aggregation

### Security Implementation
- **MD5 Signature**: Generated as `MD5(URL + Token + Timestamp)` per API spec
- **Fresh Timestamp**: Each request uses a unique timestamp to prevent replay attacks
- **No External Dependencies**: Uses Node.js built-in `crypto` module

### Code Architecture
- **Separation of Concerns**: 
  - `api/` - API communication layer (HTTP, auth, rate limiting)
  - `business/` - Business logic (serial number generation, aggregation)
- **Modular Design**: Each module has a single responsibility
- **No External Dependencies**: Only uses Node.js built-in modules

## 📊 Output Report

The client generates a comprehensive report including:
- Total devices queried
- Online/Offline device counts
- Total and average power output
- Execution time
- Sample device data

## ⚠️ Assumptions Made

1. **Serial Number Format**: SN-000 to SN-499 (3-digit zero-padded)
2. **Timestamp Format**: Milliseconds since Unix epoch (as string in headers)
3. **Endpoint URL for Signature**: Uses only the path (`/device/real/query`), not full URL
4. **Network Reliability**: Assumes local network is stable (mock server is on localhost)

## 🔍 Key Files Explained

| File | Purpose |
|------|---------|
| `index.js` | Orchestrates the entire flow: generate SNs → batch → fetch → aggregate → report |
| `rateLimiter.js` | Queue-based rate limiter ensuring 1 req/sec compliance |
| `client.js` | HTTP client with automatic retry for transient failures |
| `signature.js` | MD5 signature generation for API authentication |
| `deviceManager.js` | Business logic for SN generation, batching, and result aggregation |

## 📝 Sample Output

```
═══════════════════════════════════════════════════════════
       ⚡ EnergyGrid Data Aggregator - Starting ⚡
═══════════════════════════════════════════════════════════

📝 Step 1: Generating serial numbers...
   Generated 500 serial numbers (SN-000 to SN-499)

📦 Step 2: Creating batches...
   Created 50 batches of max 10 devices each

🌐 Step 3: Fetching data from API (this will take ~50 seconds)...
   Rate limit: 1 request per second

   ✅ Batch 50/50 (100.0%) - SN-490 to SN-499

📊 Step 4: Aggregating results...

═══════════════════════════════════════════════════════════
                      📈 FINAL REPORT
═══════════════════════════════════════════════════════════
   Total Devices Queried:    500
   Online Devices:           ~450 (90.00%)
   Offline Devices:          ~50
   Total Power Output:       ~1250.00 kW
   Average Power per Device: ~2.50 kW
   Execution Time:           ~55.00 seconds
   Failed Batches:           0
═══════════════════════════════════════════════════════════

✅ Data aggregation complete!
```
