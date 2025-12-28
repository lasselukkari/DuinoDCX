import React from 'react';
import Spinner from 'react-bootstrap/Spinner';
import Outputs from './outputs.tsx';
import Inputs from './inputs.tsx';
import {UploadDownload} from './presets/upload-download.tsx';
import {useDeviceState} from './device-state-context.tsx';

type Props = {
  readonly isBlocking: boolean;
  readonly page: string;
};

function Device({isBlocking, page}: Props) {
  const {device} = useDeviceState();
  const [showWarning, setShowWarning] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (device?.isReady) {
      setShowWarning(false);
    } else {
      timer = setTimeout(() => {
        setShowWarning(true);
      }, 5000);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [device?.isReady]);

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
        <h5 className="text-center mt-3">Synchronizing…</h5>
        {showWarning ? (
          <p className="text-muted mt-2" style={{maxWidth: '300px'}}>
            Still searching? Check RS232 cabling and Device ID.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="container">
      <div style={displayIfPage(page, 'inputs')}>
        <Inputs isBlocking={isBlocking} />
      </div>
      <div style={displayIfPage(page, 'outputs')}>
        <Outputs isBlocking={isBlocking} />
      </div>
      <div style={displayIfPage(page, 'presets')}>
        <div className="card text-white bg-secondary">
          <div className="card-body">
            <UploadDownload />
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Device);
