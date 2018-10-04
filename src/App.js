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
import {ToastContainer} from 'react-toastify';
import Spinner from 'react-spinkit';

import Manager from './dcx2496/manager';
import Inputs from './Inputs';
import Outputs from './Outputs';
import Setup from './Setup';
import ChannelLevels from './ChannelLevels';
import Connection from './Connection';
import Upload from './Upload';
import Credentials from './Credentials';

import 'bootswatch/slate/bootstrap.css'; // eslint-disable-line import/no-unassigned-import
import './App.css'; // eslint-disable-line import/no-unassigned-import

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {device: {}, page: 'levels', blocking: true, showModal: false};
    this.manager = new Manager();
    this.manager.on('update', newDevice => {
      this.updateDevice(newDevice);
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {device, page, blocking, showModal} = this.state;

    return (
      !isEqual(device, nextState.device) ||
      page !== nextState.page ||
      blocking !== nextState.blocking ||
      showModal !== nextState.showModal
    );
  }

  componentDidMount() {
    this.manager.pollDevices();
  }

  handleBlockingChange = () => {
    this.setState(({blocking}) => ({blocking: !blocking}));
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

  handleModalClose = () => {
    this.setState({showModal: false});
  };

  handleShowConnection = () => {
    this.setState({showModal: 'connection'});
  };

  handleShowUpload = () => {
    this.setState({showModal: 'upload'});
  };

  handleShowCredentials = () => {
    this.setState({showModal: 'credentials'});
  };

  updateDevice(device) {
    this.setState({device: cloneDeep(device)});
  }

  displayIfPage(name) {
    const {page} = this.state;
    return {display: page === name ? 'block' : 'none'};
  }

  content() {
    const {blocking, device} = this.state;

    if (!device.ready) {
      return (
        <div className="text-center content-loader" alt="loading">
          <Spinner fadeIn="none" name="line-scale" color="#3498DB" />
          <h5 className="text-center">Searching for devices...</h5>
        </div>
      );
    }

    return (
      <div className="container">
        <div style={this.displayIfPage('levels')}>
          <ChannelLevels
            device={device}
            blocking={blocking}
            onChange={this.handleDeviceUpdate}
          />
        </div>
        <div style={this.displayIfPage('inputs')}>
          <Inputs
            channels={device.inputs}
            setup={device.setup}
            blocking={blocking}
            onChange={this.handleDeviceUpdate}
          />
        </div>
        <div style={this.displayIfPage('outputs')}>
          <Outputs
            channels={device.outputs}
            setup={device.setup}
            blocking={blocking}
            onChange={this.handleDeviceUpdate}
          />
        </div>
        <div style={this.displayIfPage('setup')}>
          <Setup
            setup={device.setup}
            outputs={device.outputs}
            blocking={blocking}
            onChange={this.handleDeviceUpdate}
          />
        </div>
      </div>
    );
  }

  deviceMenu() {
    const {device, page} = this.state;
    if (device.ready) {
      return (
        <Nav activeKey={page} onSelect={this.handlePageChange}>
          <NavItem eventKey="levels">Levels</NavItem>
          <NavItem eventKey="inputs">Inputs</NavItem>
          <NavItem eventKey="outputs">Outputs</NavItem>
          <NavItem eventKey="setup">Setup</NavItem>
        </Nav>
      );
    }
    return null;
  }

  configMenu() {
    const {showModal} = this.state;
    return (
      <Nav pullRight activeKey={showModal}>
        <NavDropdown
          noCaret
          title={<Glyphicon glyph="cog" />}
          id="basic-nav-dropdown"
        >
          <MenuItem eventKey="connection" onSelect={this.handleShowConnection}>
            Wifi Setup
          </MenuItem>
          <MenuItem eventKey="connection" onSelect={this.handleShowCredentials}>
            Credentials
          </MenuItem>
          <MenuItem eventKey="connection" onSelect={this.handleShowUpload}>
            Firmware Update
          </MenuItem>
        </NavDropdown>
      </Nav>
    );
  }

  lockButton() {
    const {device, blocking} = this.state;
    if (device.ready) {
      return (
        <Button
          style={{
            position: 'fixed',
            bottom: '15px',
            right: '15px',
            width: '60px',
            height: '60px',
            zIndex: 1011,
            textAlign: 'center',
            fontSize: '24px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.6)'
          }}
          onClick={this.handleBlockingChange}
        >
          <Glyphicon
            style={{color: blocking ? '#ee5f5b' : '#62c462'}}
            glyph={blocking ? 'lock' : 'edit'}
          />
        </Button>
      );
    }
    return null;
  }

  brand() {
    const {device} = this.state;
    if (device.ready) {
      return (
        <Navbar.Brand>
          {`${device.name} ${device.version} (${device.state.free}% free)`}
        </Navbar.Brand>
      );
    }
    return <Navbar.Brand>DuinoDCX</Navbar.Brand>;
  }

  deviceSelect(devices) {
    if (devices.length > 0) {
      return (
        <Nav pullRight onSelect={this.handleDeviceSelect}>
          <NavDropdown title="Devices" id="basic-nav-dropdown">
            {devices.map(({name, id}, deviceId) => (
              <MenuItem key={id} eventKey={deviceId}>
                {name}
              </MenuItem>
            ))}
          </NavDropdown>
        </Nav>
      );
    }
    return null;
  }

  navbar() {
    return (
      <Navbar collapseOnSelect fluid className="navbar-fixed-top">
        <Navbar.Header>
          {this.brand()}
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          {this.deviceMenu()}
          {this.configMenu()}
          {this.deviceSelect(this.manager.devices)}
        </Navbar.Collapse>
      </Navbar>
    );
  }

  connectionModal() {
    const {showModal} = this.state;

    return (
      <Modal show={showModal === 'connection'} onHide={this.handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Wifi Setup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Connection />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.handleModalClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  credentialsModal() {
    const {showModal} = this.state;

    return (
      <Modal show={showModal === 'credentials'} onHide={this.handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Credentials</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Credentials />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.handleModalClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  uploadModal() {
    const {showModal} = this.state;

    return (
      <Modal show={showModal === 'upload'} onHide={this.handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Firmware Update</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Upload />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.handleModalClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  render() {
    return (
      <div>
        {this.navbar()}
        {this.content()}
        {this.connectionModal()}
        {this.credentialsModal()}
        {this.uploadModal()}
        {this.lockButton()}

        <ToastContainer />
      </div>
    );
  }
}

export default App;
