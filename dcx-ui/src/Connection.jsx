import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-spinkit';
import isEqual from 'lodash.isequal';
import {toast} from 'react-toastify';

class Connection extends Component {
  state = {networks: [], password: ''};
  toastOptions = {position: toast.POSITION.BOTTOM_LEFT};

  shouldComponentUpdate(nextProps, nextState) {
    const {networks, selected, password, ip, hostname} = this.state;

    return (
      !isEqual(networks, nextState.networks) ||
      selected !== nextState.selected ||
      password !== nextState.password ||
      ip !== nextState.ip ||
      hostname !== nextState.hostname
    );
  }

  componentDidMount() {
    this.fetchConnection();
    this.fetchNetworks();
  }

  showFetchError() {
    if (toast.isActive('fetch-failed')) {
      return;
    }

    toast.error(`Fetching WiFi status failed.`, {
      ...this.toastOptions,
      toastId: 'fetch-failed'
    });
  }

  async fetchConnection() {
    try {
      const response = await fetch('/api/connection', {
        credentials: 'same-origin'
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const connection = await response.json();
      this.setState({selected: connection.current, ...connection});
    } catch {
      this.showFetchError();
    }
  }

  async fetchNetworks() {
    try {
      const response = await fetch('/api/networks', {
        credentials: 'same-origin'
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const networks = await response.json();
      this.setState({networks});
    } catch {
      this.showFetchError();
    }
  }

  handlePropertyChange(property, event) {
    this.setState({[property]: event.target.value});
  }

  async updateConnection() {
    this.setState({ip: null});

    const {selected, password} = this.state;
    const formData = new FormData();
    formData.append('ssid', selected);
    formData.append('password', password);
    const data = new URLSearchParams(formData);

    try {
      const response = await fetch('/api/connection', {
        method: 'PATCH',
        body: data,
        credentials: 'same-origin'
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const connection = await response.json();
      this.setState({
        ...connection,
        selected: connection.current,
        password: ''
      });
    } catch {
      this.setState({ip: '0.0.0.0'});
      toast.error(
        `Could not connect to network ${selected}`,
        this.toastOptions
      );
    }
  }

  async diconnectConnetion() {
    try {
      await fetch('/api/connection', {
        credentials: 'same-origin',
        method: 'DELETE'
      });

      this.updateConnection();
    } catch {
      toast.error('WiFi disconnected', this.toastOptions);
    }
  }

  handleSubmit = (event) => {
    event.preventDefault();
    this.updateConnection();
  };

  handleDisconnection = (event) => {
    event.preventDefault();
    this.diconnectConnetion();
  };

  loadingSpinner() {
    return (
      <Spinner
        className="text-center"
        fadeIn="none"
        name="line-scale"
        color="#3498DB"
      />
    );
  }

  connectForm() {
    const {networks, selected, password} = this.state;

    if (networks.length === 0) {
      return this.loadingSpinner();
    }

    return (
      <Form onSubmit={this.handleSubmit}>
        <Form.Group>
          <Form.Label>Network</Form.Label>
          <Form.Control
            as="select"
            value={selected}
            onChange={(event) => this.handlePropertyChange('selected', event)}
          >
            {networks.sort().map((enumeral) => (
              <option key={enumeral}>{enumeral}</option>
            ))}
          </Form.Control>
        </Form.Group>
        <Form.Group>
          <Form.Label>Password</Form.Label>
          <Form.Control
            value={password}
            type="password"
            placeholder="Password"
            onChange={(event) => this.handlePropertyChange('password', event)}
          />
        </Form.Group>

        <Button block type="submit">
          Connect
        </Button>
      </Form>
    );
  }

  connectionForm() {
    const {ip, current} = this.state;

    if (!ip) {
      return this.loadingSpinner();
    }

    return (
      <Form onSubmit={this.handleDisconnection}>
        <Form.Group>
          <Form.Label>Network</Form.Label>
          <Form.Control disabled type="text" value={current} />
        </Form.Group>
        <Form.Group>
          <Form.Label>IP</Form.Label>
          <Form.Control disabled type="text" value={ip} />
        </Form.Group>
        <Button block type="submit">
          Disconnect
        </Button>
      </Form>
    );
  }

  render() {
    const {current} = this.state;
    if (!current) {
      return this.connectForm();
    }

    return this.connectionForm();
  }
}

export default Connection;
