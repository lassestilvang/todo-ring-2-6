#!/usr/bin/env node

/**
 * Simple load testing script
 * Run with: node scripts/load-test.js
 */

const http = require('http');
const url = require('url');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENT_REQUESTS = 10;
const TOTAL_REQUESTS = 100;

let completed = 0;
let errors = 0;
const times = [];

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const parsedUrl = url.parse(`${BASE_URL}${path}`);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      const duration = Date.now() - startTime;
      times.push(duration);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(duration);
      } else {
        errors++;
        reject(new Error(`Status ${res.statusCode}`));
      }
    });

    req.on('error', (e) => {
      errors++;
      reject(e);
    });

    req.end();
  });
}

async function runLoadTest() {
  console.log('Starting load test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Concurrent requests: ${CONCURRENT_REQUESTS}`);
  console.log(`Total requests: ${TOTAL_REQUESTS}`);
  console.log('');

  const startTime = Date.now();
  const promises = [];

  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const path = i % 3 === 0 ? '/api/tasks?view=all' :
                 i % 3 === 1 ? '/api/lists' :
                 '/api/stats';

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
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);

  console.log('');
  console.log('=== Load Test Results ===');
  console.log(`Total requests: ${TOTAL_REQUESTS}`);
  console.log(`Completed: ${TOTAL_REQUESTS - errors}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total time: ${totalTime}ms`);
  console.log(`Requests/sec: ${(TOTAL_REQUESTS / (totalTime / 1000)).toFixed(2)}`);
  console.log('');
  console.log('=== Response Times ===');
  console.log(`Min: ${minTime}ms`);
  console.log(`Max: ${maxTime}ms`);
  console.log(`Avg: ${avgTime.toFixed(2)}ms`);
  console.log('');

  if (errors > 0) {
    console.log('⚠️  Some requests failed');
    process.exit(1);
  } else {
    console.log('✅ All requests succeeded');
    process.exit(0);
  }
}

runLoadTest();