import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import useAuthStore from '../store/authStore';

let client = null;
let subscriptions = new Map();

function getWebSocketUrl() {
  const configuredUrl = import.meta.env.VITE_WS_URL;
  if (configuredUrl) {
    return configuredUrl
      .replace(/^ws:/i, 'http:')
      .replace(/^wss:/i, 'https:');
  }

  const apiBase = import.meta.env.VITE_API_URL ?? '/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}/ws`;
}

function getClient() {
  if (client) {
    return client;
  }

  client = new Client({
    webSocketFactory: () => new SockJS(getWebSocketUrl()),
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
  
  if (!stompClient.connected) return null;

  // Cleanup old subscription to the same topic if it exists
  if (subscriptions.has(key)) {
    subscriptions.get(key).unsubscribe();
  }

  const subscription = stompClient.subscribe(`/topic/room/${roomId}`, (message) => {
    callback(JSON.parse(message.body));
  });
  subscriptions.set(key, subscription);
  return subscription;
}

export function subscribeToTyping(roomId, callback) {
  const stompClient = getClient();
  const key = `typing:${roomId}`;
  
  if (!stompClient.connected) return null;

  if (subscriptions.has(key)) {
    subscriptions.get(key).unsubscribe();
  }

  const subscription = stompClient.subscribe(`/topic/room/${roomId}/typing`, (message) => {
    callback(JSON.parse(message.body));
  });
  subscriptions.set(key, subscription);
  return subscription;
}

export function subscribeToNotifications(userId, callback) {
  const stompClient = getClient();
  const key = `notifications:${userId}`;
  
  if (!stompClient.connected) return null;

  if (subscriptions.has(key)) {
    subscriptions.get(key).unsubscribe();
  }

  const subscription = stompClient.subscribe(`/topic/user/${userId}/notifications`, (message) => {
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
    destination: `/app/chat/room/${roomId}`,
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
    destination: '/app/chat/typing',
    body: JSON.stringify({ roomId, ...payload }),
  });
  return true;
}
