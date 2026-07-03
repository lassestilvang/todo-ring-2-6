/**
 * k6 Load Testing Scenarios
 * Run with: npx k6 run tests/load/scenarios.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// Custom metrics
const taskCreateTrend = new Trend('task_create_duration');
const taskFetchTrend = new Trend('task_fetch_duration');
const errorRate = new Rate('errors');
const requests = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration{scenario:tasks}': ['p(95)<500'],  // 95% of requests should be < 500ms
    'http_req_duration{scenario:lists}': ['p(95)<300'],
    'errors': ['rate<0.01'],  // Error rate should be < 1%
  },
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Scenario 1: Task operations
  group('Task Operations', function () {
    // Create task
    const createPayload = JSON.stringify({
      title: 'Load test task',
      priority: 'medium',
      status: 'pending',
    });

    const createRes = http.post(`${BASE_URL}/api/v1/tasks`, createPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(createRes, {
      'task created': (r) => r.status === 201,
    });

    taskCreateTrend.add(createRes.timings.duration);
    requests.add(1);
    errorRate.add(createRes.status !== 201);

    sleep(1);

    // Fetch tasks
    const fetchRes = http.get(`${BASE_URL}/api/v1/tasks?view=all`);
    check(fetchRes, {
      'tasks fetched': (r) => r.status === 200,
    });

    taskFetchTrend.add(fetchRes.timings.duration);
    requests.add(1);
    errorRate.add(fetchRes.status !== 200);

    sleep(1);
  });

  // Scenario 2: List operations
  group('List Operations', function () {
    const res = http.get(`${BASE_URL}/api/v1/lists`);
    check(res, {
      'lists fetched': (r) => r.status === 200,
    });
    requests.add(1);
    errorRate.add(res.status !== 200);
    sleep(1);
  });

  // Scenario 3: Time entries
  group('Time Entry Operations', function () {
    const res = http.get(`${BASE_URL}/api/v1/time-entries?period=7d`);
    check(res, {
      'time entries fetched': (r) => r.status === 200,
    });
    requests.add(1);
    errorRate.add(res.status !== 200);
    sleep(1);
  });
}

export function handleSummary(data) {
  const results = {
    'stdout': textSummary(data),
    'results.json': JSON.stringify(data),
  };
  return results;
}

function textSummary(data) {
  let txt = '';
  txt +=('\n');
  txt +=('          =======================');
  txt +=('\n');
  txt +=('          _summary_report_        ');
  txt +=('\n');
  txt +=('          =======================');
  txt +=('\n');
  txt +=('\n');
  txt +=('Check the results.json file for full details.\n');
  txt +=('\n');
  txt +=(`Tasks created: ${data.metrics['checks{type:task created}'].passes || 0}\n`);
  txt +=(`Tasks fetched: ${data.metrics['checks{type:tasks fetched}'].passes || 0}\n`);
  txt +=(`Lists fetched: ${data.metrics['checks{type:lists fetched}'].passes || 0}\n`);
  txt +=('\n');
  txt +=(`Total requests: ${data.metrics.requests.values[0]}\n`);
  txt +=(`Error rate: ${(data.metrics.errors.values[0] * 100).toFixed(2)}%\n`);
  txt +=('\n');
  return txt;
}