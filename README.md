# EnergyGrid Data Aggregator

A robust Node.js client application that fetches real-time telemetry data from 500 solar inverters, navigating strict rate limits and security protocols.

## 📋 Assignment Overview

This solution integrates with a legacy "EnergyGrid" API with the following constraints:
- **Rate Limit**: Strictly 1 request per second (HTTP 429 on violation)
- **Batch Limit**: Maximum 10 devices per request
- **Security**: Custom signature header using `MD5(URL + Token + Timestamp)`

## 🏗️ Project Structure

```
├── server.js              # Mock API server (provided)
├── package.json           # Mock API dependencies
├── instructions.md        # Assignment instructions
└── client/                # ⭐ MY SOLUTION
    ├── package.json       # Client config (no external deps)
    ├── README.md          # Detailed documentation
    └── src/
        ├── index.js       # Main orchestrator
        ├── api/
        │   ├── client.js      # HTTP client with retry logic
        │   ├── rateLimiter.js # Queue-based rate limiter
        │   └── signature.js   # MD5 signature generator
        └── business/
            └── deviceManager.js # Serial number & aggregation logic
```

## 🚀 Quick Start

### Step 1: Install Mock Server Dependencies
```bash
npm install
```

### Step 2: Start Mock Server
```bash
npm start
```
The server will run at `http://localhost:3000`

### Step 3: Run Client (in a new terminal)
```bash
cd client
npm start
```

## ✨ Features

| Feature | Implementation |
|---------|----------------|
| **500 Serial Numbers** | Generates SN-000 to SN-499 |
| **Rate Limiting** | Queue-based throttler (1.1s intervals for safety) |
| **Batching** | 50 batches of 10 devices each |
| **Authentication** | MD5 signature: `MD5(URL + Token + Timestamp)` |
| **Error Handling** | Automatic retry with exponential backoff |
| **No External Deps** | Uses only Node.js built-in modules |

## 🔧 Approach & Design Decisions

### Rate Limiting Strategy
- Implemented a **queue-based RateLimiter** class that processes requests sequentially
- Used **1100ms intervals** (100ms buffer) to prevent 429 errors
- All requests are queued and processed in order

### Error Handling
- **3 automatic retries** for transient failures (429, 5xx, network errors)
- **Exponential backoff**: 2s → 4s → 6s between retries
- Failed batches are logged but don't stop the aggregation

### Code Architecture
- **Separation of Concerns**: API layer (`api/`) vs Business logic (`business/`)
- **Modular Design**: Each module has a single responsibility
- **Zero Dependencies**: Only Node.js built-in modules (`http`, `crypto`)

## 📊 Sample Output

```
═══════════════════════════════════════════════════════════
       ⚡ EnergyGrid Data Aggregator - Starting ⚡
═══════════════════════════════════════════════════════════

📝 Step 1: Generating serial numbers...
   Generated 500 serial numbers (SN-000 to SN-499)

📦 Step 2: Creating batches...
   Created 50 batches of max 10 devices each

🌐 Step 3: Fetching data from API...
   ✅ Batch 50/50 (100.0%) - SN-490 to SN-499

═══════════════════════════════════════════════════════════
                      📈 FINAL REPORT
═══════════════════════════════════════════════════════════
   Total Devices Queried:    500
   Online Devices:           ~450 (90.00%)
   Offline Devices:          ~50
   Total Power Output:       ~1250.00 kW
   Execution Time:           ~55.00 seconds
═══════════════════════════════════════════════════════════
```

## 📝 Assumptions

1. **Serial Number Format**: SN-000 to SN-499 (3-digit zero-padded)
2. **Timestamp Format**: Milliseconds since Unix epoch
3. **Signature URL**: Uses path only (`/device/real/query`), not full URL
4. **Network**: Assumes stable localhost connection

## 👨‍💻 Author

**Praveen** - Software Engineering Internship Assignment for Arkahub
