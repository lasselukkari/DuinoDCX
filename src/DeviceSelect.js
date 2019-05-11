import React, {PureComponent} from 'react';
import {Nav, NavDropdown, MenuItem, Glyphicon} from 'react-bootstrap';

class DeviceSelect extends PureComponent {
  render() {
    const {onSelect, devices, free, selected} = this.props;
    const selectedDevice = devices.find(({id}) => id === selected);

    if (devices.length === 0 || !selectedDevice) {
      return null;
    }

    const deviceName = (
      <div>
        <div className="device-name">
          {`${selectedDevice.id}. ${selectedDevice.name} ${
            selectedDevice.version
          } (${free}%)`}
        </div>
        <Glyphicon glyph="list" />
      </div>
    );

    return (
      <Nav pullRight onSelect={onSelect}>
        <NavDropdown noCaret title={deviceName} id="basic-nav-dropdown">
          {devices.map(({name, id}, deviceId) => (
            <MenuItem key={id} eventKey={deviceId}>
              {id}. {name}
            </MenuItem>
          ))}
        </NavDropdown>
      </Nav>
    );
  }
}

export default DeviceSelect;
