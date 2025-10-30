import { API_BASE_URL } from "../api/chat";
import { Message } from "../types/api";
import { WEBSOCKET_TIMEOUT } from "../constants/config";
import { useEffect, useRef, useCallback } from "react";

let isConnected = false;

export const useWebSocket = (
  onmessage: (msg: Message) => void,
  onconnect?: (isConnected: boolean) => void
) => {
  const wsUrl = API_BASE_URL?.replace("http", "ws") + "/ws";
  const socket = useRef<WebSocket | null>(null);
  const timeoutHandle = useRef<NodeJS.Timeout | null>(null);

  const memoizedOnMessage = useCallback(onmessage, [onmessage]);
  const memoizedOnConnect = useCallback(
    (val: boolean) => onconnect?.(val),
    [onconnect]
  );

  const connect = () => {
    socket.current = new WebSocket(wsUrl!);
    socket.current.addEventListener("open", () => {
      clearTimeout(timeoutHandle.current!);
      if (!isConnected) memoizedOnConnect(true);
    });

    socket.current.addEventListener("message", (event) => {
      const data: Message = JSON.parse(event.data);
      memoizedOnMessage(data);
    });

    socket.current.addEventListener("close", () => {
      timeoutHandle.current = setTimeout(connect, WEBSOCKET_TIMEOUT);
      if(isConnected) memoizedOnConnect(false);
    });
    socket.current.addEventListener("error", (error) => {
      socket.current?.close();
      if(isConnected) memoizedOnConnect(false);
    });
  };

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(timeoutHandle.current!);
      socket.current?.close();
    };
  }, []);

  return (msg: Message) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify(msg));
    }
  };
};
