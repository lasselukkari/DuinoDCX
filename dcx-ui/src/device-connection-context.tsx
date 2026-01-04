import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import constants from './dcx2496/constants.js';
import Parser from 'dcx-parser';

type EventHandler = (data: Uint8Array) => void;

type DeviceConnectionContextValue = {
  clientId: string;
  addListener: (command: number, handler: EventHandler) => void;
  removeListener: (command: number, handler: EventHandler) => void;
};

const DeviceConnectionContext = createContext<
  DeviceConnectionContextValue | undefined
>(undefined);

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
  const eventSourceRef = useRef<EventSource | undefined>(undefined);
  const listenersRef = useRef<Record<number, Set<EventHandler>>>({});

  // Generate persistent Client ID
  clientIdRef.current ||=
    Math.random().toString(36).slice(2, 15) +
    Math.random().toString(36).slice(2, 15);

  const addListener = (command: number, handler: EventHandler) => {
    listenersRef.current[command] ||= new Set();

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

    const messageHandler = (event: MessageEvent) => {
      const rawData = event.data as string | undefined;
      if (!rawData) return;
      if (typeof rawData !== 'string') return;

      try {
        const data = Parser.hexToBytes(rawData);
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

    const errorHandler = (error: Event) => {
      console.error('SSE Singleton Error:', error);
    };

    eventSource.addEventListener('message', messageHandler);
    eventSource.addEventListener('error', errorHandler);

    return () => {
      console.log('Closing SSE Singleton');
      eventSource.removeEventListener('message', messageHandler);
      eventSource.removeEventListener('error', errorHandler);
      eventSource.close();
      eventSourceRef.current = undefined;
    };
  }, []);

  const value = useMemo(
    () => ({
      clientId: clientIdRef.current,
      addListener,
      removeListener,
    }),
    [],
  );

  return (
    <DeviceConnectionContext.Provider value={value}>
      {children}
    </DeviceConnectionContext.Provider>
  );
}
