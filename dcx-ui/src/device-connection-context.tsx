import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import constants from './dcx2496/constants';
import Parser from './dcx2496/parser';

type EventHandler = (data: Uint8Array) => void;

type DeviceConnectionContextValue = {
  clientId: string;
  addListener: (command: number, handler: EventHandler) => void;
  removeListener: (command: number, handler: EventHandler) => void;
};

const DeviceConnectionContext = createContext<
  DeviceConnectionContextValue | undefined
>(null);

export const useDeviceConnection = () => {
  const context = useContext(DeviceConnectionContext);
  if (!context) {
    throw new Error(
      'useDeviceConnection must be used within a DeviceConnectionProvider',
    );
  }

  return context;
};

export function DeviceConnectionProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const clientIdRef = useRef<string>('');
  const eventSourceRef = useRef<EventSource | undefined>(null);
  const listenersRef = useRef<Record<number, Set<EventHandler>>>({});

  // Generate persistent Client ID
  clientIdRef.current ||=
    Math.random().toString(36).slice(2, 15) +
    Math.random().toString(36).slice(2, 15);

  const addListener = (command: number, handler: EventHandler) => {
    if (!listenersRef.current[command]) {
      listenersRef.current[command] = new Set();
    }

    listenersRef.current[command].add(handler);
  };

  const removeListener = (command: number, handler: EventHandler) => {
    if (listenersRef.current[command]) {
      listenersRef.current[command].delete(handler);
    }
  };

  useEffect(() => {
    const url = `/api/events?clientId=${clientIdRef.current}`;
    console.log('Connecting to SSE:', url);
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('open', () => {
      console.log('SSE Singleton Connected', clientIdRef.current);
    });

    eventSource.onmessage = (event) => {
      if (!event.data) return;

      try {
        const data = Parser.hexToBytes(event.data);
        if (data.length <= constants.COMMAND_BYTE) return;

        const command = data[constants.COMMAND_BYTE];

        // Dispatch to listeners
        const handlers = listenersRef.current[command];
        if (handlers) {
          for (const handler of handlers) {
            try {
              handler(data);
            } catch (error) {
              console.error('Error in SSE listener handler:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error processing SSE broadcast:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Singleton Error:', error);
    };

    return () => {
      console.log('Closing SSE Singleton');
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, []);

  const value = {
    clientId: clientIdRef.current,
    addListener,
    removeListener,
  };

  return (
    <DeviceConnectionContext.Provider value={value}>
      {children}
    </DeviceConnectionContext.Provider>
  );
}
