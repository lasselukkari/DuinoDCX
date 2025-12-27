declare module 'react-block-ui' {
  import * as React from 'react';

  export type BlockUiProps = {
    blocking?: boolean;
    children?: React.ReactNode;
    tag?: string | React.ComponentType<any>;
    className?: string;
    message?: React.ReactNode;
    loader?: React.ReactNode;
    renderChildren?: boolean;
    keepInView?: boolean;
  };

  export default class BlockUi extends React.Component<BlockUiProps> {}
}
