import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Button, Modal, Navbar, Nav, NavDropdown} from 'react-bootstrap';
import {FaCog} from 'react-icons/fa';
import isEqual from 'lodash.isequal';

import DeviceSelect from './DeviceSelect';
import Localization from './Localization';
import Connection from './Connection';
import Settings from './Settings';
import Upload from './Upload';

class BottomomNavigation extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {device, devices, free} = this.props;
    const {showModal} = this.state;

    return !(
      isEqual(device, nextProps.device) &&
      isEqual(devices, nextProps.devices) &&
      free === nextProps.free &&
      showModal === nextState.showModal
    );
  }

  handleShowModal = showModal => {
    this.setState({showModal});
  };

  render() {
    const {
      device,
      devices,
      selected,
      free,
      onChange,
      onSelectDevice
    } = this.props;
    const {showModal} = this.state;

    return (
      <Navbar
        fixed="bottom"
        bg="primary"
        variant="dark"
        className="wide-nav justify-content-end"
      >
        {devices.length > 0 && free && (
          <DeviceSelect
            devices={devices}
            selected={selected}
            free={free}
            onSelect={onSelectDevice}
          />
        )}
        {device && device.ready && (
          <Localization setup={device.setup} onChange={onChange} />
        )}
        <Nav>
          <NavDropdown
            title={<FaCog />}
            id="nav-dropdown"
            drop="up"
            className="no-caret right-0 icon-menu"
          >
            <NavDropdown.Item
              eventKey="connection"
              onSelect={() => this.handleShowModal('connection')}
            >
              {' '}
              Wifi Setup
            </NavDropdown.Item>
            <NavDropdown.Item
              eventKey="settings"
              onSelect={() => this.handleShowModal('settings')}
            >
              {' '}
              Settings
            </NavDropdown.Item>
            <NavDropdown.Item
              eventKey="upload"
              onSelect={() => this.handleShowModal('upload')}
            >
              Firmware Update
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
        <Modal
          show={showModal === 'connection'}
          onHide={() => this.handleShowModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Wifi Setup</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Connection />
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => this.handleShowModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={showModal === 'settings'}
          onHide={() => this.handleShowModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Settings</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Settings />
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => this.handleShowModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={showModal === 'upload'}
          onHide={() => this.handleShowModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Firmware Update</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Upload />
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => this.handleShowModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </Navbar>
    );
  }
}

BottomomNavigation.defaultProps = {
  device: {
    ready: false,
    setup: {}
  },
  devices: [],
  selected: null,
  free: null
};

BottomomNavigation.propTypes = {
  device: PropTypes.shape({
    ready: PropTypes.bool,
    setup: PropTypes.object
  }),
  devices: PropTypes.array,
  selected: PropTypes.number,
  free: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  onSelectDevice: PropTypes.func.isRequired
};

export default BottomomNavigation;
