import {memo} from 'react';
import Navbar from 'react-bootstrap/Navbar';
import type {State} from 'dcx-parser';
import Localization from './localization.js';
import Config from './config.js';
import {useBreakpoint} from './hooks/use-breakpoint.js';

type ConfigNavigationProps = {
  readonly device: State | undefined;
  readonly free?: number;
};

function ConfigNavigationComponent({device, free}: ConfigNavigationProps) {
  const breakpoint = useBreakpoint();
  const isXs = breakpoint === 'xs';
  const status = free === undefined ? 'Syncing...' : `Free: ${free}%`;

  return (
    <Navbar
      fixed={isXs ? 'top' : 'bottom'}
      bg="primary"
      variant="dark"
      className="justify-content-end p-0"
    >
      {device?.setup ? (
        <Localization setup={device.setup} isXs={isXs} />
      ) : undefined}
      <span className="navbar-text text-light me-3 small">{status}</span>
      <Config isXs={isXs} />
    </Navbar>
  );
}

ConfigNavigationComponent.defaultProps = {
  free: 0,
};

const ConfigNavigation = memo(ConfigNavigationComponent);

ConfigNavigation.displayName = 'ConfigNavigation';

export default ConfigNavigation;
