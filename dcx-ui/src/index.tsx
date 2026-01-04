import { createRoot } from 'react-dom/client';
import App from './app.js';
import { DcxConnectionProvider } from './connection/connection-context.js';

const container = document.querySelector('#root');
if (container) {
  const root = createRoot(container);
  root.render(
    <DcxConnectionProvider>
      <App />
    </DcxConnectionProvider>,
  );
}
