import React from 'react';
import Spinner from 'react-bootstrap/Spinner';
import Outputs from './outputs.tsx';
import Inputs from './inputs.tsx';
import {type State} from './dcx2496/parser.tsx';

type Props = {
  readonly isBlocking: boolean;
  readonly page: string;
  readonly device: State;
  readonly onChange: (args: any) => void;
};

function Device({isBlocking, device, onChange, page}: Props) {
  const displayIfPage = (name: string, exected: string) => ({
    display: name === exected ? 'block' : 'none',
  });

  if (!device?.isReady) {
    return (
      <div
        className="text-center content-loader"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <Spinner animation="border" variant="primary" />
        <h5 className="text-center mt-3">Searching…</h5>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={displayIfPage(page, 'inputs')}>
        <Inputs
          channels={device.inputs}
          setup={device.setup}
          isBlocking={isBlocking}
          onChange={onChange}
        />
      </div>
      <div style={displayIfPage(page, 'outputs')}>
        <Outputs
          channels={device.outputs}
          setup={device.setup}
          isBlocking={isBlocking}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export default React.memo(Device);
