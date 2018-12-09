import React, {Component} from 'react';
import {Nav, NavDropdown, MenuItem, Glyphicon} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

class DeviceSelect extends Component {
  shouldComponentUpdate(nextProps) {
    const {devices, device} = this.props;
    return (
      devices.length !== nextProps.devices.length ||
      device.name !== nextProps.device.name ||
      device.id !== nextProps.device.id ||
      !isEqual(device.state, nextProps.device.state)
    );
  }

  render() {
    const {onSelect, devices, device} = this.props;

    if (devices.length === 0) {
      return null;
    }

    const deviceName = (
      <div>
        <div className="device-name">
          {`${device.id}. ${device.name} ${device.version} (${
            device.state.free
          }%)`}
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
