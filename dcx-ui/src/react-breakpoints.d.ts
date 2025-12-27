declare module 'react-breakpoints' {
  import * as React from 'react';

  export type Breakpoints = Record<string, number>;

  export type ReactBreakpointsProps = {
    breakpoints: Breakpoints;
    children: React.ReactNode;
  };

  export default class ReactBreakpoints extends React.Component<ReactBreakpointsProps> {}
}
