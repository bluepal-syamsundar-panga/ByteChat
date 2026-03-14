import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import useAuthStore from '../store/authStore';

let stompClient = null;

export const connectWebSocket = (onMessageReceived) => {
  const token = useAuthStore.getState().token;
  if (!token) return;

  const socket = new SockJS('http://localhost:8080/ws');
  stompClient = new Client({
    webSocketFactory: () => socket,
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    debug: function (str) {
      console.log('STOMP: ' + str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = (frame) => {
    console.log('Connected: ' + frame);
  };

  stompClient.onStompError = (frame) => {
    console.error('Broker reported error: ' + frame.headers['message']);
    console.error('Additional details: ' + frame.body);
  };

  stompClient.activate();
};

export const subscribeToRoom = (roomId, callback) => {
  if (stompClient && stompClient.connected) {
    return stompClient.subscribe(`/topic/room.${roomId}`, (message) => {
      callback(JSON.parse(message.body));
    });
  }
  return null;
};

export const sendMessage = (roomId, content) => {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: `/app/chat.room.${roomId}`,
      body: JSON.stringify({ content, type: 'TEXT' })
    });
  }
};

export const disconnectWebSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
  }
};
