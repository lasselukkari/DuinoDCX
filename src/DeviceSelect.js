import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {Nav, NavDropdown} from 'react-bootstrap';

class DeviceSelect extends PureComponent {
  render() {
    const {onSelect, devices, free, selected} = this.props;
    const selectedDevice = devices.find(({id}) => id === selected);

    if (devices.length === 0 || !selectedDevice || !free) {
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

DeviceSelect.propTypes = {
  onSelect: PropTypes.func.isRequired,
  devices: PropTypes.array.isRequired,
  free: PropTypes.number.isRequired,
  selected: PropTypes.number.isRequired
};

export default DeviceSelect;
