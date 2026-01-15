/**
 * Router configuration for the application.
 */
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Navigate,
} from '@tanstack/react-router';
import type { DcxConnection } from 'dcx-parser';
import { App, InputsWrapper, OutputsWrapper } from './App.js';
import Presets from '@/pages/Presets.js';

// Re-export useDeviceContext for convenience
export { useDeviceContext } from './App.js';

type RouterContext = {
  connection: DcxConnection | undefined;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: App,
});

// Index route - redirect to inputs
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/inputs" />,
});

// Inputs routes
const inputsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'inputs',
});

const inputsIndexRoute = createRoute({
  getParentRoute: () => inputsRoute,
  path: '/',
  component: () => <InputsWrapper />,
});

const inputsEqualizersRoute = createRoute({
  getParentRoute: () => inputsRoute,
  path: 'equalizers/$channelId',
  component: () => <InputsWrapper />,
});

const inputsDynamicEqualizersRoute = createRoute({
  getParentRoute: () => inputsRoute,
  path: 'dynamic-equalizers',
  component: () => <InputsWrapper />,
});

const inputsTabRoute = createRoute({
  getParentRoute: () => inputsRoute,
  path: '$tab',
  component: () => <InputsWrapper />,
});

// Outputs routes
const outputsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'outputs',
});

const outputsIndexRoute = createRoute({
  getParentRoute: () => outputsRoute,
  path: '/',
  component: () => <OutputsWrapper />,
});

const outputsEqualizersRoute = createRoute({
  getParentRoute: () => outputsRoute,
  path: 'equalizers/$channelId',
  component: () => <OutputsWrapper />,
});

const outputsDynamicEqualizersRoute = createRoute({
  getParentRoute: () => outputsRoute,
  path: 'dynamic-equalizers',
  component: () => <OutputsWrapper />,
});

const outputsTabRoute = createRoute({
  getParentRoute: () => outputsRoute,
  path: '$tab',
  component: () => <OutputsWrapper />,
});

// Presets route
const presetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'presets',
  component: () => <Presets />,
});

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  inputsRoute.addChildren([
    inputsIndexRoute,
    inputsEqualizersRoute,
    inputsDynamicEqualizersRoute,
    inputsTabRoute,
  ]),
  outputsRoute.addChildren([
    outputsIndexRoute,
    outputsEqualizersRoute,
    outputsDynamicEqualizersRoute,
    outputsTabRoute,
  ]),
  presetsRoute,
]);

// Create and export router
export const router = createRouter({
  routeTree,
  context: {
    connection: undefined as DcxConnection | undefined,
  },
});

// Type augmentation for router
declare module '@tanstack/react-router' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    router: typeof router;
  }
}
