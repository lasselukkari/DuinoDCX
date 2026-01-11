import {createRoot} from 'react-dom/client';
import {RouterProvider} from '@tanstack/react-router';
import {
  DcxConnectionProvider,
  useDcxConnection,
} from '@/connection/connectionContext.js';
import {router} from '@/router.js';

function AppWrapper() {
  const {connection} = useDcxConnection();
  return <RouterProvider router={router} context={{connection}} />;
}

const container = document.querySelector('#root');
if (container) {
  const root = createRoot(container);
  root.render(
    <DcxConnectionProvider>
      <AppWrapper />
    </DcxConnectionProvider>,
  );
}
