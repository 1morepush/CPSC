"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type WSStatus = "connecting" | "connected" | "disconnected" | "error";

export function useWebSocket<T>(url: string, onMessage: (data: T) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WSStatus>("connecting");
  const retryTimeout = useRef<ReturnType<typeof setTimeout>>();
  const retryCount = useRef(0);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = () => {
        setStatus("connected");
        retryCount.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as T;
          onMessageRef.current(data);
        } catch {
          // ignore parse errors
        }
      };

      socket.onclose = () => {
        setStatus("disconnected");
        const delay = Math.min(1000 * 2 ** retryCount.current, 30000);
        retryCount.current += 1;
        retryTimeout.current = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        setStatus("error");
        socket.close();
      };
    } catch {
      setStatus("error");
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryTimeout.current);
      ws.current?.close();
    };
  }, [connect]);

  return { status };
}
