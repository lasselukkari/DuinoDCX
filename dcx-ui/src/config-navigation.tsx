/* eslint-disable react/require-default-props */
import React, { memo } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import isEqual from 'lodash.isequal';
import Localization from './localization.tsx';
import DeviceSelect from './device-select.tsx';
import Config from './config.tsx';
import { type ChangeEventArgs } from './parameters/index.tsx';
import { type Device, type State } from './dcx2496/parser.ts';
import { useBreakpoint } from './hooks/use-breakpoint.ts';

type ConfigNavigationProps = {
  readonly device?: State | undefined;
  readonly devices: Device[];
  readonly selected?: number;
  readonly free?: number;
  readonly onChange: (args: ChangeEventArgs) => void;
  readonly onSelectDevice: (device: number) => void;
};

const ConfigNavigation = memo(
  ({
    device = undefined,
    devices,
    selected = 0,
    free = undefined,
    onChange,
    onSelectDevice,
  }: ConfigNavigationProps) => {
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
          <Localization setup={device.setup} isXs={isXs} onChange={onChange} />
        ) : null}
        <Config isXs={isXs} />
      </Navbar>
    );
  },
  (previousProps, nextProps) => {
    return (
      isEqual(previousProps.device, nextProps.device) &&
      isEqual(previousProps.devices, nextProps.devices) &&
      previousProps.free === nextProps.free
      // Breakpoint is internal now, so we don't compare it in props
    );
  },
);

export default ConfigNavigation;
