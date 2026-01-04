import {memo} from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Localization from './localization.js';
import DeviceSelect from './device-select.js';
import Config from './config.js';
import {useBreakpoint} from './hooks/use-breakpoint.js';
import {useDeviceState} from './device-state-context.js';

type ConfigNavigationProps = {
  // eslint-disable-next-line react/require-default-props
  readonly free?: number;
  readonly onSelectDevice: (device: number) => void;
};

const ConfigNavigation = memo(
  ({free = 0, onSelectDevice}: ConfigNavigationProps) => {
    const {device, devices, selected} = useDeviceState();
    const breakpoint = useBreakpoint();
    const isXs = breakpoint === 'xs';

    return (
      <Navbar
        fixed={isXs ? 'top' : 'bottom'}
        bg="primary"
        variant="dark"
        className="justify-content-end p-0"
      >
        {devices.length > 0 && free !== undefined ? (
          <DeviceSelect
            devices={devices}
            selected={selected ?? 0}
            free={free}
            isXs={isXs}
            onSelect={(id) => {
              if (id) onSelectDevice(Number(id));
            }}
          />
        ) : null}
        {device?.isReady && device.setup ? (
          // @ts-expect-error Setup is partial
          <Localization setup={device.setup} isXs={isXs} />
        ) : null}
        <Config isXs={isXs} />
      </Navbar>
    );
  },
);

ConfigNavigation.displayName = 'ConfigNavigation';

export default ConfigNavigation;
