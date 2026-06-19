#!/usr/bin/env node

/**
 * Enhanced Load Testing Script
 * Run with: node scripts/load-test.js
 *
 * Environment variables:
 * - BASE_URL: Base URL to test (default: http://localhost:3000)
 * - CONCURRENT_REQUESTS: Concurrent requests (default: 10)
 * - TOTAL_REQUESTS: Total requests (default: 100)
 * - THRESHOLD_P95: P95 response time threshold in ms (default: 500)
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENT_REQUESTS = parseInt(process.env.CONCURRENT_REQUESTS || '10', 10);
const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS || '100', 10);
const THRESHOLD_P95 = parseInt(process.env.THRESHOLD_P95 || '500', 10);

let errors = 0;
const times = [];
const errorDetails = [];
const endpoints = {};

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const parsedUrl = url.parse(`${BASE_URL}${path}`);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.path,
      method: 'GET',
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      const duration = Date.now() - startTime;
      times.push({ duration, path, status: res.statusCode });

      // Track endpoint stats
      if (!endpoints[path]) {
        endpoints[path] = { count: 0, totalTime: 0, errors: 0 };
      }
      endpoints[path].count++;
      endpoints[path].totalTime += duration;
      if (res.statusCode >= 400) {
        endpoints[path].errors++;
      }

      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(duration);
      } else {
        errors++;
        errorDetails.push({ path, status: res.statusCode, duration });
        reject(new Error(`Status ${res.statusCode}`));
      }
    });

    req.on('error', (e) => {
      errors++;
      errorDetails.push({ path, error: e.message });
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      errors++;
      errorDetails.push({ path, error: 'timeout' });
      reject(new Error('timeout'));
    });

    req.end();
  });
}

function calculatePercentile(arr, p) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  if (Math.floor(index) === index) {
    return sorted[index];
  }
  return sorted[Math.floor(index)] + (sorted[Math.ceil(index)] - sorted[Math.floor(index)]) * (index - Math.floor(index));
}

function generateReport() {
  const totalTime = times.reduce((sum, t) => sum + t.duration, 0);
  const avgTime = times.length > 0 ? totalTime / times.length : 0;
  const maxTime = Math.max(...times.map(t => t.duration), 0);
  const minTime = Math.min(...times.map(t => t.duration), Infinity);
  const p95 = calculatePercentile(times.map(t => t.duration), 95);
  const p99 = calculatePercentile(times.map(t => t.duration), 99);

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalRequests: TOTAL_REQUESTS,
    concurrentRequests: CONCURRENT_REQUESTS,
    results: {
      completed: TOTAL_REQUESTS - errors,
      errors: errors,
      successRate: ((TOTAL_REQUESTS - errors) / TOTAL_REQUESTS * 100).toFixed(2) + '%',
      requestsPerSecond: (TOTAL_REQUESTS / (totalTime / 1000)).toFixed(2),
    },
    responseTimes: {
      min: minTime + 'ms',
      max: maxTime + 'ms',
      avg: avgTime.toFixed(2) + 'ms',
      p95: p95 + 'ms',
      p99: p99 + 'ms',
    },
    endpointStats: Object.entries(endpoints).map(([path, stats]) => ({
      path,
      requests: stats.count,
      avgTime: (stats.totalTime / stats.count).toFixed(2) + 'ms',
      errorRate: ((stats.errors / stats.count) * 100).toFixed(2) + '%',
    })),
  };

  return report;
}

async function runLoadTest() {
  console.log('Starting load test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Concurrent requests: ${CONCURRENT_REQUESTS}`);
  console.log(`Total requests: ${TOTAL_REQUESTS}`);
  console.log(`P95 threshold: ${THRESHOLD_P95}ms`);
  console.log('');

  const startTime = Date.now();
  const promises = [];

  const endpoints = [
    '/api/tasks?view=all',
    '/api/lists',
    '/api/stats',
    '/api/tasks?view=today',
    '/api/tasks?view=next7',
  ];

  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const path = endpoints[i % endpoints.length];

    promises.push(
      makeRequest(path).catch(() => {})
    );

    // Limit concurrent requests
    if (promises.length >= CONCURRENT_REQUESTS) {
      await Promise.all(promises.splice(0, CONCURRENT_REQUESTS));
    }
  }

  await Promise.all(promises);

  const totalTime = Date.now() - startTime;
  const report = generateReport();

  console.log('');
  console.log('=== Load Test Results ===');
  console.log(`Total requests: ${report.totalRequests}`);
  console.log(`Completed: ${report.results.completed}`);
  console.log(`Errors: ${report.results.errors}`);
  console.log(`Success Rate: ${report.results.successRate}`);
  console.log(`Total time: ${totalTime}ms`);
  console.log(`Requests/sec: ${report.results.requestsPerSecond}`);
  console.log('');
  console.log('=== Response Times ===');
  console.log(`Min: ${report.responseTimes.min}`);
  console.log(`Max: ${report.responseTimes.max}`);
  console.log(`Avg: ${report.responseTimes.avg}`);
  console.log(`P95: ${report.responseTimes.p95}`);
  console.log(`P99: ${report.responseTimes.p99}`);
  console.log('');
  console.log('=== Endpoint Stats ===');
  report.endpointStats.forEach(stat => {
    console.log(`${stat.path}: ${stat.requests} requests, avg ${stat.avgTime}, ${stat.errorRate} errors`);
  });

  // Save report
  const reportPath = path.join(__dirname, '..', 'coverage', 'load-test-report.json');
  fs.makedirsSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  // Check against thresholds
  const p95Value = parseInt(report.responseTimes.p95);
  const successRate = parseFloat(report.results.successRate);

  let passed = true;
  if (p95Value > THRESHOLD_P95) {
    console.log(`\n⚠️  P95 (${p95Value}ms) exceeds threshold (${THRESHOLD_P95}ms)`);
    passed = false;
  }

  if (successRate < 95) {
    console.log(`\n⚠️  Success rate (${successRate}%) is below 95%`);
    passed = false;
  }

  if (errors > 0) {
    console.log('\n⚠️  Some requests failed');
    console.log('\nError details:');
    errorDetails.slice(0, 5).forEach(e => {
      console.log(`  - ${e.path}: ${e.status || e.error}`);
    });
    if (errorDetails.length > 5) {
      console.log(`  ... and ${errorDetails.length - 5} more errors`);
    }
    passed = false;
  }

  if (passed) {
    console.log('\n✅ All performance thresholds met');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runLoadTest();