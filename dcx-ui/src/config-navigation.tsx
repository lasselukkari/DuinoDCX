import {memo} from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Localization from './localization.tsx';
import DeviceSelect from './device-select.tsx';
import Config from './config.tsx';
import {useBreakpoint} from './hooks/use-breakpoint.ts';
import {useDeviceState} from './device-state-context.tsx';

type ConfigNavigationProps = {
  readonly free?: number;
  readonly onSelectDevice: (device: number) => void;
};

const ConfigNavigation = memo(
  ({free = undefined, onSelectDevice}: ConfigNavigationProps) => {
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
        {devices.length > 0 && free ? (
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
  (previousProps, nextProps) => {
    return previousProps.free === nextProps.free;
  },
);

export default ConfigNavigation;
