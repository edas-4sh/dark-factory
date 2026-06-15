import { useEffect, useRef, useCallback } from 'react';

type EventHandler = (event: { type: string; payload: Record<string, unknown>; timestamp: number }) => void;

export function useWebSocket(handler: EventHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const reconnect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(url);

    ws.onmessage = (event) => {
      try {
        handlerRef.current(JSON.parse(event.data));
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      wsRef.current = null;
      setTimeout(reconnect, 3000);
    };

    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, []);

  useEffect(() => {
    reconnect();
    return () => {
      wsRef.current?.close();
    };
  }, [reconnect]);
}
