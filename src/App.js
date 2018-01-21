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

import SVGInline from 'react-svg-inline';

import Manager from './dcx2496/manager';
import Inputs from './Inputs';
import Outputs from './Outputs';
import Setup from './Setup';
import ChannelLevels from './ChannelLevels';

import 'bootswatch/slate/bootstrap.css'; // eslint-disable-line import/no-unassigned-import
import './App.css'; // eslint-disable-line import/no-unassigned-import

const loading = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <style>
    .white{fill:#fff}
  </style>
  <circle cx="64" cy="64" r="64"/>
  <path d="M60.5 38L38 52H28c-2.2 0-4 1.8-4 4v16c0 2.2 1.8 4 4 4h10l22.5 14c.6.5 1.5 0 1.5-.8V38.8c0-.7-.8-1.2-1.5-.8zm27.2 58.8l-1.3-1.5c-.4-.4-.3-1 .1-1.4C95.1 86.3 100 75.5 100 64c0-11.8-5.1-22.9-14.1-30.5-.2-.1-.5-.4-.9-.7s-.5-.9-.2-1.3l1.1-1.7c.3-.5 1-.6 1.4-.2l1 .8C98.3 38.8 104 51 104 64c0 12.6-5.4 24.6-14.8 33-.5.3-1.1.3-1.5-.2z" class="white"/>
  <path d="M79.1 88.3l-1.2-1.6c-.3-.4-.3-1 .2-1.4C84.4 80 88 72.3 88 64s-3.6-16-10-21.3c-.4-.3-.5-1-.2-1.4l1.2-1.6c.3-.4 1-.5 1.4-.2C87.8 45.7 92 54.5 92 64s-4.2 18.3-11.5 24.4c-.4.4-1 .3-1.4-.1z" class="white"/>
  <path d="M69.6 78.2c-.4-.4-.3-1.1.1-1.4 4-3.1 6.3-7.8 6.3-12.7 0-5.1-2.3-9.8-6.3-12.7-.4-.3-.5-1-.2-1.4l1.3-1.5c.3-.4.9-.5 1.4-.2C77.1 51.8 80 57.7 80 64c0 6.1-2.9 11.9-7.7 15.8-.4.3-1 .3-1.4-.1l-1.3-1.5z" class="white"/>
</svg>
`;

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
          <SVGInline svg={loading}/>
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
