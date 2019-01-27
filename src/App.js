import React, {Component} from 'react';
import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
import {
  Button,
  Modal,
  Navbar,
  Nav,
  NavItem,
  NavDropdown,
  MenuItem,
  Glyphicon
} from 'react-bootstrap';
import {ToastContainer, toast} from 'react-toastify';

import Manager from './dcx2496/manager';
import ChannelLevels from './ChannelLevels';
import Connection from './Connection';
import Upload from './Upload';
import Settings from './Settings';
import DeviceSelect from './DeviceSelect';
import Device from './Device';
import Localization from './Localization';

import 'bootswatch/slate/bootstrap.css'; // eslint-disable-line import/no-unassigned-import
import 'react-toastify/dist/ReactToastify.css'; // eslint-disable-line import/no-unassigned-import
import './App.css'; // eslint-disable-line import/no-unassigned-import

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {device: {}, page: 'inputs', blocking: true, showModal: false};
    this.toastPosition = toast.POSITION.BOTTOM_LEFT;
    this.manager = new Manager();
    this.manager.on('update', newDevice => this.updateDevice(newDevice));
    this.manager.on('error', () =>
      toast.error(`Failed to update settings.`, {position: this.toastPosition})
    );
    this.manager.on('connected', connected => {
      if (connected && toast.isActive('no-connection')) {
        toast.dismiss('no-connection');
      } else if (!toast.isActive('no-connection')) {
        toast.error(`Check network connection.`, {
          position: this.toastPosition,
          toastId: 'no-connection',
          autoClose: false
        });
      }
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {device, page, blocking, showModal, showLevels} = this.state;

    return (
      !isEqual(device, nextState.device) ||
      page !== nextState.page ||
      blocking !== nextState.blocking ||
      showModal !== nextState.showModal ||
      showLevels !== nextState.showLevels
    );
  }

  componentDidMount() {
    this.manager.pollDevices();
  }

  handleBlockingChange = () => {
    this.setState(({blocking}) => ({blocking: !blocking}));
  };

  handleLevelsShowChange = (isOpen, event, {source}) => {
    if (source === 'rootClose') {
      this.setState(() => ({showLevels: true}));
    } else {
      this.setState(({showLevels}) => ({showLevels: !showLevels}));
    }
  };

  handleDeviceUpdate = data => {
    const {device} = this.state;
    this.manager.updateDevice(device.id, data);
  };

  handlePageChange = page => {
    this.setState({page});
    window.scrollTo(0, 0);
  };

  handleDeviceSelect = selectedDevice => {
    this.manager.selectedDevice = selectedDevice;
  };

  handleShowModal = showModal => {
    this.setState({showModal});
  };

  updateDevice(device) {
    this.setState({device: cloneDeep(device)});
  }

  topNavigation() {
    const {showLevels} = this.state;
    const {device, blocking, page} = this.state;

    if (!device.ready) {
      return null;
    }

    return (
      <Navbar fluid fixedTop className="top-nav" style={{}}>
        <Nav className="end-button">
          <NavDropdown
            noCaret
            open={showLevels}
            activeKey={showLevels}
            className="channel-levels"
            title={<Glyphicon glyph="equalizer" />}
            id="channel-levels-dropdown"
            onToggle={this.handleLevelsShowChange}
          >
            <ChannelLevels
              device={device}
              blocking={blocking}
              onChange={this.handleDeviceUpdate}
            />
          </NavDropdown>
        </Nav>
        <Nav
          activeKey={page}
          className="middle-buttons"
          onSelect={this.handlePageChange}
        >
          <NavItem eventKey="inputs">Inputs</NavItem>
          <NavItem eventKey="outputs">Outputs</NavItem>
        </Nav>
        <Nav pullRight activeKey="blocking" className="end-button">
          <NavItem
            eventKey={blocking ? 'not-blocking' : 'blocking'}
            onClick={this.handleBlockingChange}
          >
            <Glyphicon
              style={{color: blocking ? '#ee5f5b' : '#62c462'}}
              glyph={blocking ? 'lock' : 'edit'}
            />
          </NavItem>
        </Nav>
      </Navbar>
    );
  }

  bottomNavigation() {
    const {device, showModal} = this.state;
    const {devices} = this.manager;

    return (
      <Navbar fluid fixedBottom>
        <Nav pullRight activeKey={showModal}>
          <NavDropdown
            noCaret
            title={<Glyphicon glyph="cog" />}
            id="config-dropdown"
          >
            <MenuItem
              eventKey="connection"
              onSelect={() => this.handleShowModal('connection')}
            >
              Wifi Setup
            </MenuItem>
            <MenuItem
              eventKey="settings"
              onSelect={() => this.handleShowModal('settings')}
            >
              Settings
            </MenuItem>
            <MenuItem
              eventKey="upload"
              onSelect={() => this.handleShowModal('upload')}
            >
              Firmware Update
            </MenuItem>
          </NavDropdown>
        </Nav>

        {device.ready && (
          <div>
            <Localization
              setup={device.setup}
              onChange={this.handleDeviceUpdate}
            />
            <DeviceSelect
              devices={devices}
              device={device}
              onSelect={this.handleDeviceSelect}
            />
          </div>
        )}
      </Navbar>
    );
  }

  connectionModal() {
    const {showModal} = this.state;

    return (
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
    );
  }

  settingsModal() {
    const {showModal} = this.state;

    return (
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
    );
  }

  uploadModal() {
    const {showModal} = this.state;

    return (
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
    );
  }

  render() {
    const {blocking, device, page} = this.state;

    return (
      <div>
        {this.topNavigation()}
        <Device
          blocking={blocking}
          device={device}
          page={page}
          onChange={this.handleDeviceUpdate}
        />
        {this.connectionModal()}
        {this.settingsModal()}
        {this.uploadModal()}
        {this.bottomNavigation()}
        <ToastContainer />
      </div>
    );
  }
}

export default App;
