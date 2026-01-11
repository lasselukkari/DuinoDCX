import { memo } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import type { State } from 'dcx-parser';
import Localization from './localization.js';
import Config from './config.js';
import { useBreakpoint } from './hooks/use-breakpoint.js';

type ConfigNavigationProps = {
  readonly device: State | undefined;
  readonly free?: number;
};

const ConfigNavigation = memo(({ device, free: _free = 0 }: ConfigNavigationProps) => {
  const breakpoint = useBreakpoint();
  const isXs = breakpoint === 'xs';

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
      <Config isXs={isXs} />
    </Navbar>
  );
});

ConfigNavigation.displayName = 'ConfigNavigation';

export default ConfigNavigation;
