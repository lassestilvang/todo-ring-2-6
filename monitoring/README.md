# Monitoring Configuration for TaskPlanner

## Overview
This directory contains monitoring configurations for Prometheus and Grafana to provide observability into the TaskPlanner application.

## Prometheus Configuration
Metrics are exposed at `/metrics` endpoint and scraped by Prometheus.

### Key Metrics
- `http_requests_total`: HTTP request counts by method, endpoint, status
- `http_request_duration_seconds`: Request latency histogram
- `process_resident_memory_bytes`: Memory usage
- `nodejs_eventloop_lag_seconds`: Event loop delay
- `db_query_duration_seconds`: Database query performance
- `cache_hits_total` / `cache_misses_total`: Redis cache efficiency
- `job_processed_total`: Background job processing metrics
- `websocket_connections_active`: Active real-time connections

## Grafana Dashboards
Pre-built dashboards for different aspects of the system.

### Application Overview Dashboard
- Traffic volume and error rates
- Response time percentiles
- Throughput trends
- Top slow endpoints

### Database Performance Dashboard
- Query execution times
- Connection pool utilization
- Slow query detection
- Index usage statistics

### Cache Performance Dashboard
- Hit/miss ratios
- Memory utilization
- Eviction rates
- Key distribution

### Infrastructure Dashboard
- CPU and memory usage per pod
- Network I/O
- Disk utilization
- Container restart rates

### Business Metrics Dashboard
- Active user count
- Task creation/completion rates
- Collaboration events per minute
- Feature flag usage

## Alerting Rules
Configured alerts for:
- High error rate (>5% for 5m)
- Increased latency (p95 > 2s for 10m)
- Service downtime
- Database connection issues
- Memory leaks
- Queue backlog growth