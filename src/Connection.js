import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-spinkit';
import isEqual from 'lodash.isequal';
import {toast} from 'react-toastify';

function handleFetchErrors(response) {
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return response;
}

class Connection extends Component {
  constructor() {
    super();
    this.state = {networks: [], password: ''};
    this.toastOptions = {position: toast.POSITION.BOTTOM_LEFT};
  }

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

  updateConnection() {
    return fetch('/api/connection', {credentials: 'same-origin'})
      .then(handleFetchErrors)
      .then(response => response.json())
      .then(connection => {
        this.setState({selected: connection.current, ...connection});
      });
  }

  componentDidMount() {
    this.updateConnection()
      .then(() => this.updateNetworks())
      .catch(() =>
        toast.error(`Fetching WiFi status failed.`, this.toastOptions)
      );
  }

  updateNetworks() {
    return fetch('/api/networks', {credentials: 'same-origin'})
      .then(handleFetchErrors)
      .then(response => response.json())
      .then(networks => {
        if (networks.length === 0) {
          return this.updateNetworks();
        }

        this.setState({networks});
      });
  }

  handleNetworkSelect = e => {
    const selected = e.target.value;
    this.setState({selected});
  };

  handlePasswordChange = e => {
    const password = e.target.value;
    this.setState({password});
  };

  handleSubmit = e => {
    e.preventDefault();
    this.setState({ip: null});

    const {selected, password} = this.state;
    const formData = new FormData();
    formData.append('ssid', selected);
    formData.append('password', password);
    const data = new URLSearchParams(formData);

    fetch('/api/connection', {
      method: 'PATCH',
      body: data,
      credentials: 'same-origin'
    })
      .then(handleFetchErrors)
      .then(response => response.json())
      .then(connection => {
        this.setState({
          ...connection,
          selected: connection.current,
          password: ''
        });
      })
      .catch(() => {
        this.setState({ip: '0.0.0.0'});
        toast.error(
          `Could not connect to network ${selected}`,
          this.toastOptions
        );
      });
  };

  handleDisconnection = e => {
    e.preventDefault();
    return fetch('/api/connection', {
      credentials: 'same-origin',
      method: 'DELETE'
    })
      .then(handleFetchErrors)
      .then(() => this.updateConnection())
      .catch(() => toast.error('WiFi disconnected', this.toastOptions));
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
            onChange={this.handleNetworkSelect}
          >
            {networks.sort().map(enumeral => (
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
            onChange={this.handlePasswordChange}
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
