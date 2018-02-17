import React, {Component} from 'react';
import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
import {
  Navbar,
  Nav,
  NavItem,
  NavDropdown,
  MenuItem,
  Glyphicon
} from 'react-bootstrap';
import {ToastContainer, toast, style} from 'react-toastify';
import Spinner from 'react-spinkit';


import Manager from './dcx2496/manager';
import Inputs from './Inputs';
import Outputs from './Outputs';
import Setup from './Setup';
import ChannelLevels from './ChannelLevels';

import 'bootswatch/slate/bootstrap.css'; // eslint-disable-line import/no-unassigned-import
import './App.css'; // eslint-disable-line import/no-unassigned-import


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {device: {}, page: 'levels', blocking: true};
    this.manager = new Manager();
    this.manager.on('update', (newDevice, isLocalUpdate) => {
      this.updateDevice(newDevice, isLocalUpdate);
    });
    this.toastId = null;
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {device, page, blocking} = this.state;

    return !isEqual(device, nextState.device) || page !== nextState.page || blocking !== nextState.blocking;
  }

  componentDidMount() {
    this.manager.pollDevices();
  }

  componentDidUpdate(previousProps, previousState) {
    const {isLocalUpdate, device} = this.state;

    if (
      !isLocalUpdate && !(
        isEqual(device.setup, previousState.device.setup) &&
        isEqual(device.inputs, previousState.device.inputs) &&
        isEqual(device.outputs, previousState.device.outputs)
      ) && !isEqual({}, previousState.device)
    ) {
      if (toast.isActive(this.toastId)) {
        toast.update(this.toastId, {autoClose: 5000});
      } else {
        this.toastId = toast.info('Remote changes loaded.', {
          position: toast.POSITION.BOTTOM_LEFT,
          style: style({width: '220px'}),
          autoClose: 5000
        });
      }
    }
  }

  handleBlockingChange = () => { // eslint-disable-line no-undef
    this.setState(({device, page, blocking}) => ({device, page, blocking: !blocking}));
  };

  handleDeviceUpdate = data => { // eslint-disable-line no-undef
    const {device} = this.state;
    this.manager.updateDevice(device.id, data);
  };

  handlePageChange = page => { // eslint-disable-line no-undef
    this.setState(({blocking, device}) => ({device, page, blocking}));
    window.scrollTo(0, 0);
  };

  handleDeviceSelect = selectedDevice => { // eslint-disable-line no-undef
    this.manager.selectedDevice = selectedDevice;
  };

  updateDevice(newDevice, isLocalUpdate) {
    this.setState(({blocking, page}) => ({
      device: cloneDeep(newDevice),
      page,
      blocking,
      isLocalUpdate
    }));
  }

  displayIfPage(name) {
    const {page} = this.state;
    return {display: page === name ? 'block' : 'none'};
  }

  render() {
    const {blocking, device, page} = this.state;

    if (!device.ready) {
      return (
        <div className="Device-loading center-block" alt="loading">
          <Spinner name="line-scale" color="#3498DB"/>
        </div>
      );
    }

    return (
      <div>
        <Navbar className="navbar-fixed-top" collapseOnSelect fluid>
          <Navbar.Header>
            <Navbar.Brand>
              {`${device.name} ${device.version} (${
                device.state.free
              } % free)`}
            </Navbar.Brand>
            <Navbar.Toggle/>
          </Navbar.Header>
          <Navbar.Collapse>
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
            <Nav pullRight onSelect={this.handleDeviceSelect}>
              <NavDropdown title="Select Device" id="basic-nav-dropdown">
                {this.manager.devices.map(({name, id}, deviceId) => (
                  <MenuItem key={id} eventKey={deviceId}>
                    {name}
                  </MenuItem>
                ))}
              </NavDropdown>
            </Nav>
            <Nav
              activeKey={blocking ? 'blocking' : 'unlocked'}
              pullRight
              onSelect={this.handleBlockingChange}
            >
              <NavItem style={{minWidth: '98px'}} eventKey="unlocked">
                <Glyphicon
                  style={{color: blocking ? '#62c462' : '#ee5f5b'}}
                  glyph={blocking ? 'lock' : 'edit'}
                />
                {' '}
                {blocking ? 'Locked' : 'Editing'}
              </NavItem>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <ToastContainer/>
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
      </div>
    );
  }
}

export default App;
