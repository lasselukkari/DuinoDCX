import {FaEdit, FaLock, FaSignal} from 'react-icons/fa';
import React, {useState} from 'react';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Navbar from 'react-bootstrap/Navbar';
import isEqual from 'lodash.isequal';
import ChannelLevels from './channel-levels.tsx';
import {useBreakpoint} from './hooks/use-breakpoint.ts';
import {useDeviceState} from './device-state-context.tsx';

type ChannelLevel = {
  readonly isLimited: boolean;
  readonly level: number;
};

type Props = {
  readonly page: string;
  readonly isBlocking: boolean;
  readonly inputs: ChannelLevel[];
  readonly outputs: ChannelLevel[];
  readonly onPageChange: (
    eventKey: string | undefined,
    event: React.SyntheticEvent<unknown>,
  ) => void;
  readonly onBlockingChange: () => void;
};

function DeviceNavigation({
  isBlocking,
  page,
  inputs,
  outputs,
  onPageChange,
  onBlockingChange,
}: Props) {
  const {device} = useDeviceState();
  const [showLevels, setShowLevels] = useState(false);
  const currentBreakpoint = useBreakpoint();

  if (!device || !device.isReady || !inputs || !outputs) {
    return null;
  }

  // Let's verify standard NavDropdown behavior. usually you want to close.
  // Maybe "rootClose" logic was inverse?
  // I'll implement exactly as is.

  const handleToggle = (_nextShow: boolean, meta: {source?: string}) => {
    if (meta.source === 'rootClose') {
      setShowLevels(true);
    } else {
      setShowLevels((previous) => !previous);
    }
  };

  const isXs = currentBreakpoint === 'xs';

  return (
    <Navbar
      fixed={isXs ? 'bottom' : 'top'}
      bg="primary"
      variant="dark"
      className="p-0"
    >
      <Nav className="end-button">
        <NavDropdown
          show={showLevels}
          className="channel-levels no-caret"
          title={<FaSignal />}
          id="channel-levels-dropdown"
          drop={isXs ? 'up' : 'down'}
          onToggle={handleToggle}
        >
          <ChannelLevels inputs={inputs} outputs={outputs} />
        </NavDropdown>
      </Nav>
      <Nav
        className="middle-buttons"
        onSelect={onPageChange as (eventKey: string | undefined) => void}
      >
        <Nav.Item>
          <Nav.Link active={page === 'inputs'} eventKey="inputs">
            Inputs
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={page === 'outputs'} eventKey="outputs">
            Outputs
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={page === 'presets'} eventKey="presets">
            Presets
          </Nav.Link>
        </Nav.Item>
      </Nav>
      <Nav activeKey="isBlocking" className="end-button">
        <Nav.Item onClick={onBlockingChange}>
          <Nav.Link>
            {' '}
            {isBlocking ? (
              <FaLock style={{color: '#ee5f5b'}} />
            ) : (
              <FaEdit style={{color: '#62c462'}} />
            )}
          </Nav.Link>
        </Nav.Item>
      </Nav>
    </Navbar>
  );
}

export default React.memo(DeviceNavigation, (previousProps, nextProps) => {
  return (
    isEqual(previousProps.inputs, nextProps.inputs) &&
    isEqual(previousProps.outputs, nextProps.outputs) &&
    previousProps.isBlocking === nextProps.isBlocking &&
    previousProps.page === nextProps.page
  );
});
