import {createRoot} from 'react-dom/client';
import App from './app.tsx';
import {DeviceConnectionProvider} from './device-connection-context';
import {DeviceStateProvider} from './device-state-context.tsx';

const container = document.querySelector('#root');
if (container) {
  const root = createRoot(container);
  root.render(
    <DeviceConnectionProvider>
      <DeviceStateProvider>
        <App />
      </DeviceStateProvider>
    </DeviceConnectionProvider>,
  );
}
