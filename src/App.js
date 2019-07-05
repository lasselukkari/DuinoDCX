import React, {Component} from 'react';
import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
import {ToastContainer, toast} from 'react-toastify';

import Parser from './dcx2496/parser';
import TopNavigation from './TopNavigation';
import Device from './Device';
import BottomNavigation from './BottomNavigation';

import 'bootswatch/dist/slate/bootstrap.css'; // eslint-disable-line import/no-unassigned-import
import 'react-toastify/dist/ReactToastify.css'; // eslint-disable-line import/no-unassigned-import
import './App.css'; // eslint-disable-line import/no-unassigned-import

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {page: 'inputs', blocking: true, showModal: false};
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {
      device,
      selected,
      inputs,
      outputs,
      free,
      page,
      blocking,
      showModal,
      showLevels
    } = this.state;

    return (
      !isEqual(device, nextState.device) ||
      !isEqual(inputs, nextState.inputs) ||
      !isEqual(outputs, nextState.outputs) ||
      !isEqual(free, nextState.free) ||
      selected !== nextState.selected ||
      page !== nextState.page ||
      blocking !== nextState.blocking ||
      showModal !== nextState.showModal ||
      showLevels !== nextState.showLevels
    );
  }

  componentDidMount() {
    this.pollState();
    this.stateTimer = setInterval(() => this.pollState(), 1000);
    this.pollStatus();
    this.statusTimer = setInterval(() => this.pollStatus(), 500);
  }

  componentWillUnmount() {
    clearInterval(this.stateTimer);
    clearInterval(this.statusTimer);
  }

  async pollState() {
    if (this.pollingState) {
      return;
    }

    this.pollingState = true;

    try {
      const response = await fetch(`api/state`, {credentials: 'same-origin'});
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      if (this.invalidateUntil > new Date()) {
        return;
      }

      const buffer = await response.arrayBuffer();
      this.setState(Parser.parseState(buffer));
    } catch {
      if (toast.isActive('no-connection')) {
        return;
      }

      toast.error(`Check network connection.`, {
        position: toast.POSITION.BOTTOM_LEFT,
        toastId: 'no-connection',
        autoClose: false
      });
    } finally {
      this.pollingState = false;
    }
  }

  async pollStatus() {
    if (this.pollingStatus) {
      return;
    }

    this.pollingStatus = true;
    try {
      const response = await fetch(`api/status`, {credentials: 'same-origin'});
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const buffer = await response.arrayBuffer();
      this.setState(Parser.parseStatus(buffer));
    } catch {
      if (toast.isActive('no-connection')) {
        return;
      }

      toast.error(`Check network connection.`, {
        position: toast.POSITION.BOTTOM_LEFT,
        toastId: 'no-connection',
        autoClose: false
      });
    } finally {
      this.pollingStatus = false;
    }
  }

  handleBlockingChange = () => {
    this.setState(({blocking}) => ({blocking: !blocking}));
  };

  handleDeviceUpdate = async commands => {
    const {device: oldDevice, selected} = this.state;
    const device = cloneDeep(oldDevice);
    const data = Parser.serializeCommands(selected, device, commands);

    this.setState({device});

    const invalidateUntil = new Date();
    invalidateUntil.setSeconds(invalidateUntil.getSeconds() + 2);
    this.invalidateUntil = invalidateUntil;

    try {
      await fetch(`/api/commands`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/binary'},
        body: data
      });
    } catch {
      this.setState({device: oldDevice});
      toast.error(`Failed to update settings.`, {
        position: toast.POSITION.BOTTOM_LEFT,
        toastId: 'failed-command',
        autoClose: true
      });
    }
  };

  handleDeviceSelect = async selected => {
    const oldSelected = this.state.selected;
    this.setState({selected});

    try {
      await fetch(`/api/selected`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {'Content-Type': 'text/plain'},
        body: selected.toString()
      });
    } catch {
      this.setState({selected: oldSelected});
      toast.error(`Failed set selected device.`, {
        position: toast.POSITION.BOTTOM_LEFT,
        toastId: 'failed-select',
        autoClose: true
      });
    }
  };

  handlePageChange = page => {
    this.setState({page});
    window.scrollTo(0, 0);
  };

  render() {
    const {
      page,
      device,
      devices,
      free,
      selected,
      blocking,
      inputs,
      outputs
    } = this.state;

    return (
      <div>
        <TopNavigation
          device={device}
          blocking={blocking}
          page={page}
          inputs={inputs}
          outputs={outputs}
          onChange={this.handleDeviceUpdate}
          onPageChange={this.handlePageChange}
          onBlockingChange={this.handleBlockingChange}
        />
        <Device
          blocking={blocking}
          device={device}
          page={page}
          onChange={this.handleDeviceUpdate}
        />
        <BottomNavigation
          device={device}
          devices={devices}
          selected={selected}
          free={free}
          onChange={this.handleDeviceUpdate}
          onSelectDevice={this.handleDeviceSelect}
        />
        <ToastContainer />
      </div>
    );
  }
}

export default App;
