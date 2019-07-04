import React, {PureComponent} from 'react';
import {Nav, NavDropdown} from 'react-bootstrap';

class DeviceSelect extends PureComponent {
  render() {
    const {onSelect, devices, free, selected} = this.props;
    const selectedDevice = devices.find(({id}) => id === selected);

    if (devices.length === 0 || !selectedDevice) {
      return null;
    }

    const deviceName = `${selectedDevice.id}. ${selectedDevice.name} ${selectedDevice.version} (${free}%)`;

    return (
      <Nav onSelect={onSelect}>
        <NavDropdown title={deviceName} drop="up" className="right-0">
          {devices.map(({name, id}, deviceId) => (
            <NavDropdown.Item key={id} eventKey={deviceId}>
              {id}. {name}
            </NavDropdown.Item>
          ))}
        </NavDropdown>
      </Nav>
    );
  }
}

export default DeviceSelect;
