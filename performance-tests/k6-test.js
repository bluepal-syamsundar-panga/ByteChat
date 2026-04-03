import http from 'k6/http';
import { check, sleep } from 'k6';
import ws from 'k6/ws';

// -------------------------------------------------------------------------------------------------
// CONFIGURATION
// -------------------------------------------------------------------------------------------------
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const WS_URL = BASE_URL.replace('http', 'ws') + '/ws/websocket'; // SockJS uses /websocket suffix for raw ws

export const options = {
  scenarios: {
    // Stage 1: Ramping up users to test authentication and basic API performance
    api_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 }, // Ramp up to 20 users
        { duration: '1m', target: 20 },  // Stay at 20 users
        { duration: '30s', target: 0 },  // Ramp down
      ],
      gracefulStop: '30s',
    },
    // Stage 2: Heavy load on the messaging system (Optional)
    // messaging_stress: { ... }
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
  },
};

// -------------------------------------------------------------------------------------------------
// TEST DATA
// -------------------------------------------------------------------------------------------------
const TEST_USER = {
  email: 'syampanga2003@gmail.com',
  password: 'Syam@1805',
};

// -------------------------------------------------------------------------------------------------
// MAIN TEST FLOW
// -------------------------------------------------------------------------------------------------
export default function () {
  // 1. LOGIN
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(TEST_USER), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => r.json().data && r.json().data.accessToken,
  });

  if (loginRes.status !== 200) {
    console.log(`Login failed for ${TEST_USER.email}`);
    return;
  }

  const token = loginRes.json().data.accessToken;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. FETCH MESSAGES (Load Test for a specific channel)
  const channelId = 1; // Change to a valid channel ID for your environment
  const msgRes = http.get(`${BASE_URL}/api/messages/channel/${channelId}?size=50`, {
    headers: authHeaders,
  });

  check(msgRes, {
    'fetch messages status is 200': (r) => r.status === 200,
  });

  // 3. SEND A MESSAGE (Stress Test for message broadcasting)
  const payload = JSON.stringify({
    content: `Performance test message from VU ${__VU} at ${new Date().toISOString()}`,
  });

  const sendRes = http.post(`${BASE_URL}/api/messages/channel/${channelId}`, payload, {
    headers: authHeaders,
  });

  check(sendRes, {
    'send message status is 200': (r) => r.status === 200,
  });

  // 4. WEBSOCKET CONNECTION (STOMP Simulation)
  // This simulates a user staying connected and receiving updates.
  /*
  const response = ws.connect(WS_URL, null, function (socket) {
    socket.on('open', function () {
      // Send STOMP Connect frame
      socket.send('CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\u0000');
      
      // Subscribe to a channel topic
      socket.send(`SUBSCRIBE\nid:sub-0\ndestination:/topic/channel/${channelId}\n\n\u0000`);
    });

    socket.on('message', function (data) {
      // Successfully received a message update
      // console.log(`VU ${__VU} received: ${data}`);
    });

    socket.on('error', function (e) {
      console.log(`WebSocket error: ${e.error()}`);
    });

    socket.setTimeout(function () {
      socket.close();
    }, 5000); // Keep connection open for 5 seconds
  });
  */

  sleep(1); // Wait 1s between iterations
}
