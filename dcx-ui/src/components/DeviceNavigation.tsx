import {FaEdit, FaLock, FaSignal} from 'react-icons/fa';
import React, {useState} from 'react';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Navbar from 'react-bootstrap/Navbar';
import isEqual from 'react-fast-compare';
import {type State} from 'dcx-parser';
import {Link, useLocation} from '@tanstack/react-router';
import ChannelLevels from '@/components/ChannelLevels.tsx';
import {useBreakpoint} from '@/hooks/useBreakpoint.ts';

type Props = {
  readonly device?: State;
  readonly isBlocking: boolean;
  readonly inputs: any[];
  readonly outputs: any[];
  readonly onBlockingChange: () => void;
};

function DeviceNavigation({
  device: _device,
  isBlocking,
  inputs,
  outputs,
  onBlockingChange,
}: Props) {
  const [showLevels, setShowLevels] = useState(false);
  const currentBreakpoint = useBreakpoint();
  const location = useLocation();
  const page = location.pathname.startsWith('/outputs')
    ? 'outputs'
    : location.pathname.startsWith('/presets')
      ? 'presets'
      : 'inputs';

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
          <ChannelLevels device={_device} inputs={inputs} outputs={outputs} />
        </NavDropdown>
      </Nav>
      <Nav className="middle-buttons">
        <Nav.Item>
          <Nav.Link as={Link} to="/inputs" active={page === 'inputs'}>
            Inputs
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/outputs" active={page === 'outputs'}>
            Outputs
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/presets" active={page === 'presets'}>
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
    isEqual(previousProps.device, nextProps.device)
  );
});
