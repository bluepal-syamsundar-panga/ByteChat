# ByteChat Performance Testing with K6

This directory contains performance testing scripts for the ByteChat application using [Grafana K6](https://k6.io/).

## Prerequisites

- [Grafana K6](https://k6.io/docs/getting-started/installation/) must be installed.
- The ByteChat backend must be running (default `http://localhost:8080`).

### Installation for Windows

Open PowerShell as Administrator and run:
```powershell
choco install k6
```
Or download the MSI from the [K6 download page](https://github.com/grafana/k6/releases).

## Running the Tests

To run the default test script:

```bash
k6 run performance-tests/k6-test.js
```

### Customizing the Server URL

You can override the base URL using an environment variable:

```bash
k6 run -e BASE_URL=https://your-staging-server.com performance-tests/k6-test.js
```

## Scenarios

The `k6-test.js` script includes:
1.  **Authentication**: Tests the login endpoint.
2.  **API Performance**: Measures response times for fetching and sending messages.
3.  **WebSocket (Optional)**: Can be enabled to test STOMP message broadcasting.

## Analysis of Results

- `http_req_duration`: Look for the **p(95)** value. It should be below **500ms** for a smooth user experience.
- `http_req_failed`: Should be **0%**. Any failures indicate server instability under load.
- `vus`: Number of virtual users being simulated at once.
