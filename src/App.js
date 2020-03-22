import React, {Component} from 'react';
import {ToastContainer, toast} from 'react-toastify';
import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
import ConfigNavigation from './ConfigNavigation';
import Device from './Device';
import DeviceNavigation from './DeviceNavigation';
import Parser from './dcx2496/parser';
import 'bootswatch/dist/slate/bootstrap.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

class App extends Component {
  state = {page: 'inputs', isBlocking: true, showModal: false};

  shouldComponentUpdate(nextProps, nextState) {
    const {
      device,
      selected,
      inputs,
      outputs,
      free,
      page,
      isBlocking,
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
      isBlocking !== nextState.isBlocking ||
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
      toast.dismiss('no-connection');
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
      toast.dismiss('no-connection');
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
    this.setState(({isBlocking}) => ({isBlocking: !isBlocking}));
  };

  handleDeviceUpdate = async (commands) => {
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

  handleDeviceSelect = async (selected) => {
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

  handlePageChange = (page) => {
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
      isBlocking,
      inputs,
      outputs
    } = this.state;

    return (
      <div>
        {device && inputs && outputs && (
          <DeviceNavigation
            device={device}
            isBlocking={isBlocking}
            page={page}
            inputs={inputs}
            outputs={outputs}
            onChange={this.handleDeviceUpdate}
            onPageChange={this.handlePageChange}
            onBlockingChange={this.handleBlockingChange}
          />
        )}
        <Device
          isBlocking={isBlocking}
          device={device}
          page={page}
          onChange={this.handleDeviceUpdate}
        />
        <ConfigNavigation
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
