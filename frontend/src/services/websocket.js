import { Client } from '@stomp/stompjs';
import useAuthStore from '../store/authStore';

let client = null;
let subscriptions = new Map();

function getWebSocketUrl() {
  const configuredUrl = import.meta.env.VITE_WS_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return origin.replace(/^http/i, 'ws') + '/ws';
}

function getClient() {
  if (client) {
    return client;
  }

  client = new Client({
    brokerURL: getWebSocketUrl(),
    connectHeaders: {
      Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ''}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });

  client.onStompError = (frame) => {
    console.error('STOMP error', frame.headers.message, frame.body);
  };

  client.onWebSocketError = (event) => {
    console.error('WebSocket error', event);
  };

  return client;
}

export function connectWebSocket(onConnect) {
  const stompClient = getClient();
  if (stompClient.active) {
    if (stompClient.connected && onConnect) {
      onConnect(stompClient);
    }
    return stompClient;
  }

  stompClient.onConnect = () => {
    if (onConnect) {
      onConnect(stompClient);
    }
  };

  stompClient.activate();
  return stompClient;
}

export function disconnectWebSocket() {
  subscriptions.forEach((subscription) => subscription.unsubscribe());
  subscriptions = new Map();

  if (client) {
    client.deactivate();
    client = null;
  }
}

export function subscribeToRoom(roomId, callback) {
  const stompClient = getClient();
  const key = `room:${roomId}`;
  if (!stompClient.connected || subscriptions.has(key)) {
    return subscriptions.get(key);
  }

  const subscription = stompClient.subscribe(`/topic/room.${roomId}`, (message) => {
    callback(JSON.parse(message.body));
  });
  subscriptions.set(key, subscription);
  return subscription;
}

export function subscribeToTyping(roomId, callback) {
  const stompClient = getClient();
  const key = `typing:${roomId}`;
  if (!stompClient.connected || subscriptions.has(key)) {
    return subscriptions.get(key);
  }

  const subscription = stompClient.subscribe(`/topic/room/${roomId}/typing`, (message) => {
    callback(JSON.parse(message.body));
  });
  subscriptions.set(key, subscription);
  return subscription;
}

export function publishRoomMessage(roomId, payload) {
  const stompClient = getClient();
  if (!stompClient.connected) {
    return false;
  }

  stompClient.publish({
    destination: `/app/chat.room.${roomId}`,
    body: JSON.stringify(payload),
  });
  return true;
}

export function publishTyping(roomId, payload) {
  const stompClient = getClient();
  if (!stompClient.connected) {
    return false;
  }

  stompClient.publish({
    destination: '/app/chat.typing',
    body: JSON.stringify({ roomId, ...payload }),
  });
  return true;
}
