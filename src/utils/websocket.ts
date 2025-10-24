import { API_BASE_URL } from "../api/chat";
import { Message } from "../types/api";
import { WEBSOCKET_TIMEOUT } from "../constants/config";
import { useEffect, useRef, useCallback } from "react";

export const useWebSocket = (
  onmessage: (msg: Message) => void,
  onconnect?: () => void
) => {
  const wsUrl = API_BASE_URL?.replace("http", "ws") + "/ws";
  const socket = useRef<WebSocket | null>(null);
  const timeoutHandle = useRef<NodeJS.Timeout | null>(null);

  const memoizedOnMessage = useCallback(onmessage, [onmessage]);
  const memoizedOnConnect = useCallback(() => onconnect?.(), [onconnect]);

  const connect = useCallback(() => {
    socket.current = new WebSocket(wsUrl!);
    socket.current.addEventListener("open", () => {
      console.log("WebSocket connected");
      clearTimeout(timeoutHandle.current!);
      memoizedOnConnect();
    });

    socket.current.addEventListener("message", (event) => {
      const data: Message = JSON.parse(event.data);
      memoizedOnMessage(data);
    });

    socket.current.addEventListener("close", () => {
      console.log("WebSocket disconnected, attempting to reconnect...");
      timeoutHandle.current = setTimeout(connect, WEBSOCKET_TIMEOUT);
    });
    socket.current.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      socket.current?.close();
    });
  }, [wsUrl, memoizedOnMessage, memoizedOnConnect]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(timeoutHandle.current!);
      socket.current?.close();
    };
  }, [connect]);

  return (msg:Message)=>{
    if (socket.current?.readyState === WebSocket.OPEN) {
        socket.current.send(JSON.stringify(msg));
    }
  }
};
