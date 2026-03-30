import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import useAuthStore from '../store/authStore';

let client = null;
let subscriptions = new Map();
let connectCallbacks = new Set();

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

export function connectWebSocket(onConnectCallback) {
  const stompClient = getClient();
  if (onConnectCallback) {
    connectCallbacks.add(onConnectCallback);
  }
  if (stompClient.active) {
    if (stompClient.connected) {
      // Sync any listeners that were registered before the connection was established
      onConnect();
      onConnectCallback?.(stompClient);
    }
    return stompClient;
  }

  stompClient.onConnect = () => {
    // Sync any listeners that were registered before the connection was established
    onConnect();

    connectCallbacks.forEach((callback) => callback(stompClient));
  };

  stompClient.activate();
  return stompClient;
}

export function disconnectWebSocket() {
  subscriptions.forEach((subscription) => subscription.unsubscribe());
  subscriptions = new Map();
  connectCallbacks = new Set();

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

export function subscribeToChannel(channelId, callback) {
  const stompClient = getClient();
  const key = `channel:${channelId}`;
  
  if (!stompClient.connected) return null;

  if (subscriptions.has(key)) {
    subscriptions.get(key).unsubscribe();
  }

  const subscription = stompClient.subscribe(`/topic/channel/${channelId}`, (message) => {
    callback(JSON.parse(message.body));
  });
  subscriptions.set(key, subscription);
  return subscription;
}

export function subscribeToTyping(workspaceId, callback) {
  const stompClient = getClient();
  const key = `typing:${workspaceId}`;
  
  if (!stompClient.connected) return null;

  if (subscriptions.has(key)) {
    subscriptions.get(key).unsubscribe();
  }

  const subscription = stompClient.subscribe(`/topic/typing.${workspaceId}`, (message) => {
    callback(JSON.parse(message.body));
  });
  subscriptions.set(key, subscription);
  return subscription;
}

// Internal registry to track all active listeners
const notificationListeners = new Map(); // userId -> Set<callback>
const dmListeners = new Map(); // userId -> Set<callback>

// Internal registry of STOMP subscriptions
const activeSubscriptions = new Map(); // topicKey -> stompSubscription

/**
 * Ensures a subscription is active for a given topic if there are any listeners.
 */
function syncSubscriptions() {
  const stompClient = getClient();
  if (!stompClient || !stompClient.connected) return;

  // Sync notifications
  notificationListeners.forEach((callbacks, userId) => {
    const key = `notifications:${userId}`;
    if (callbacks.size > 0 && !activeSubscriptions.has(key)) {
      console.log(`Establishing WebSocket subscription for ${key}`);
      const sub = stompClient.subscribe(`/topic/user/${userId}/notifications`, (message) => {
        const data = JSON.parse(message.body);
        notificationListeners.get(userId)?.forEach(cb => cb(data));
      });
      activeSubscriptions.set(key, sub);
    }
  });

  // Sync DMs
  dmListeners.forEach((callbacks, userId) => {
    const key = `dm:${userId}`;
    if (callbacks.size > 0 && !activeSubscriptions.has(key)) {
      console.log(`Establishing WebSocket subscription for ${key}`);
      const sub = stompClient.subscribe(`/topic/dm/${userId}`, (message) => {
        const data = JSON.parse(message.body);
        dmListeners.get(userId)?.forEach(cb => cb(data));
      });
      activeSubscriptions.set(key, sub);
    }
  });
}

// Re-sync whenever the client connects
export function onConnect() {
  syncSubscriptions();
}

/**
 * Subscribe to notifications. Will automatically connect when WebSocket is ready.
 */
export function subscribeToNotifications(userId, callback) {
  if (!notificationListeners.has(userId)) {
    notificationListeners.set(userId, new Set());
  }
  notificationListeners.get(userId).add(callback);
  
  // Try to sync immediately
  syncSubscriptions();

  return {
    unsubscribe: () => {
      const callbacks = notificationListeners.get(userId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          const key = `notifications:${userId}`;
          activeSubscriptions.get(key)?.unsubscribe();
          activeSubscriptions.delete(key);
        }
      }
    }
  };
}

/**
 * Subscribe to DMs. Will automatically connect when WebSocket is ready.
 */
export function subscribeToDM(userId, callback) {
  if (!dmListeners.has(userId)) {
    dmListeners.set(userId, new Set());
  }
  dmListeners.get(userId).add(callback);

  // Try to sync immediately
  syncSubscriptions();

  return {
    unsubscribe: () => {
      const callbacks = dmListeners.get(userId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          const key = `dm:${userId}`;
          activeSubscriptions.get(key)?.unsubscribe();
          activeSubscriptions.delete(key);
        }
      }
    }
  };
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

export function publishChannelMessage(channelId, payload) {
  const stompClient = getClient();
  if (!stompClient.connected) {
    return false;
  }

  stompClient.publish({
    destination: `/app/chat/channel/${channelId}`,
    body: JSON.stringify(payload),
  });
  return true;
}

export function publishTyping(workspaceId, payload) {
  const stompClient = getClient();
  if (!stompClient.connected) {
    return false;
  }

  stompClient.publish({
    destination: '/app/chat.typing',
    body: JSON.stringify({ workspaceId, ...payload }),
  });
  return true;
}
