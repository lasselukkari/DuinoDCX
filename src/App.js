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

import Spinner from 'react-spinkit';

import Manager from './dcx2496/manager';
import Inputs from './Inputs';
import Outputs from './Outputs';
import Setup from './Setup';
import ChannelLevels from './ChannelLevels';
import Config from './Config';

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

    return !isEqual(device, nextState.device) ||
      page !== nextState.page ||
      blocking !== nextState.blocking ||
      showModal !== nextState.showModal;
  }

  componentDidMount() {
    this.manager.pollDevices();
  }

  handleBlockingChange = () => { // eslint-disable-line no-undef
    this.setState(({blocking}) => ({blocking: !blocking}));
  };

  handleDeviceUpdate = data => { // eslint-disable-line no-undef
    const {device} = this.state;
    this.manager.updateDevice(device.id, data);
  };

  handlePageChange = page => { // eslint-disable-line no-undef
    this.setState({page});
    window.scrollTo(0, 0);
  };

  handleDeviceSelect = selectedDevice => { // eslint-disable-line no-undef
    this.manager.selectedDevice = selectedDevice;
  };

  handleModalClose = () => { // eslint-disable-line no-undef
    this.setState({showModal: false});
  };

  handleModalShow = () => { // eslint-disable-line no-undef
    this.setState({showModal: true});
  };

  updateDevice(device) {
    this.setState({device: cloneDeep(device)});
  }

  displayIfPage(name) {
    const {page} = this.state;
    return {display: page === name ? 'block' : 'none'};
  }

  content() {
    const {blocking, device, page} = this.state;

    if (!device.ready) {
      if (page === 'config') {
        return (
          <div className="container">
            <Config/>
          </div>
        );
      }
      return (
        <div className="text-center content-loader" alt="loading">
          <Spinner fadeIn="none" name="line-scale" color="#3498DB"/>
          <h5 className="text-center">
            Searching for devices...
          </h5>
        </div>
      );
    }

    return (
      <div className="container">
        <div style={this.displayIfPage('levels')}>
          <ChannelLevels
            device={device}
            onChange={this.handleDeviceUpdate}
            blocking={blocking}
          />
        </div>
        <div style={this.displayIfPage('inputs')}>
          <Inputs
            onChange={this.handleDeviceUpdate}
            channels={device.inputs}
            blocking={blocking}
          />
        </div>
        <div style={this.displayIfPage('outputs')}>
          <Outputs
            onChange={this.handleDeviceUpdate}
            channels={device.outputs}
            blocking={blocking}
          />
        </div>
        <div style={this.displayIfPage('setup')}>
          <Setup
            onChange={this.handleDeviceUpdate}
            setup={device.setup}
            outputs={device.outputs}
            blocking={blocking}
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
          <NavItem eventKey="levels">
            Levels
          </NavItem>
          <NavItem eventKey="inputs">
            Inputs
          </NavItem>
          <NavItem eventKey="outputs">
            Outputs
          </NavItem>
          <NavItem eventKey="setup">
            Setup
          </NavItem>
        </Nav>
      );
    }
    return null;
  }

  configMenu() {
    const {showModal} = this.state;
    return (
      <Nav pullRight activeKey={showModal ? 'config' : ''} onSelect={this.handleModalShow}>
        <NavItem eventKey="config">
          <Glyphicon glyph="cog"/>
        </NavItem>
      </Nav>
    );
  }

  lockButton() {
    const {device, blocking} = this.state;
    if (device.ready) {
      return (
        <Nav
          activeKey={blocking ? 'blocking' : 'unlocked'}
          onSelect={this.handleBlockingChange}
        >
          <NavItem eventKey="unlocked">
            <Glyphicon
              style={{color: blocking ? '#62c462' : '#ee5f5b'}}
              glyph={blocking ? 'lock' : 'edit'}
            />

          </NavItem>
        </Nav>
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
    return (
      <Navbar.Brand>
        DuinoDCX
      </Navbar.Brand>
    );
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
      <Navbar className="navbar-fixed-top" collapseOnSelect fluid>
        <Navbar.Header>
          {this.brand()}
          <Navbar.Toggle/>
        </Navbar.Header>
        <Navbar.Collapse>
          {this.lockButton()}
          {this.deviceMenu()}
          {this.configMenu()}
          {this.deviceSelect(this.manager.devices)}

        </Navbar.Collapse>
      </Navbar>
    );
  }

  conenctionModal() {
    const {showModal} = this.state;
    return (
      <Modal show={showModal} onHide={this.handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>
          Config
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Config/>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.handleModalClose}>
          Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  render() {
    return (
      <div>
        {this.navbar()}
        {this.content()}
        {this.conenctionModal()}
      </div>
    );
  }
}

export default App;
