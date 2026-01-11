import React from 'react';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';

type Props = {
  readonly onSelect: (
    eventKey: string | undefined,
    event: React.SyntheticEvent<unknown>,
  ) => void;
  readonly devices: Array<{id: number; name: string; version: number}>;
  readonly free: number;
  readonly selected: number;
  readonly isXs: boolean;
};

function DeviceSelect({onSelect, devices, free, selected, isXs}: Props) {
  const selectedDevice = devices.find(({id}) => id === selected);

  if (devices.length === 0 || !selectedDevice || !free) {
    return undefined;
  }

  const deviceName = `${selectedDevice.id}. ${selectedDevice.name} ${selectedDevice.version} (${free}%)`;

  return (
    <Nav
      onSelect={(eventKey, event) => {
        onSelect(eventKey ?? undefined, event);
      }}
    >
      <NavDropdown
        title={deviceName}
        drop={isXs ? 'down' : 'up'}
        className="right-0"
      >
        {devices.map(({name, id}) => (
          <NavDropdown.Item key={id} eventKey={id}>
            {id}. {name}
          </NavDropdown.Item>
        ))}
      </NavDropdown>
    </Nav>
  );
}

export default React.memo(DeviceSelect);
