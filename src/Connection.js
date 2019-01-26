import React, {Component} from 'react';
import isEqual from 'lodash.isequal';
import {
  Row,
  Form,
  FormControl,
  FormGroup,
  ControlLabel,
  Button,
  Col
} from 'react-bootstrap';
import {toast} from 'react-toastify';
import Spinner from 'react-spinkit';

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

  updateConnection() {
    return fetch('/api/connection', {credentials: 'same-origin'})
      .then(handleFetchErrors)
      .then(response => response.json())
      .then(connection => {
        this.setState({selected: connection.current, ...connection});
      });
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

  componentDidMount() {
    this.updateConnection()
      .then(() => this.updateNetworks())
      .catch(() =>
        toast.error(`Fetching WiFi status failed.`, this.toastOptions)
      );
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
      .catch(() =>
        toast.error(
          `Could not connect to network ${selected}`,
          this.toastOptions
        )
      );
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

    if (networks.length > 0) {
      return (
        <Form horizontal onSubmit={this.handleSubmit}>
          <FormGroup>
            <Col componentClass={ControlLabel} md={4}>
              Network
            </Col>
            <Col md={8}>
              <FormControl
                componentClass="select"
                value={selected}
                onChange={this.handleNetworkSelect}
              >
                {networks.sort().map(enumeral => (
                  <option key={enumeral}>{enumeral}</option>
                ))}
              </FormControl>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} md={4}>
              Password
            </Col>
            <Col md={8}>
              <FormControl
                value={password}
                type="password"
                placeholder="Password"
                onChange={this.handlePasswordChange}
              />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col mdOffset={4} md={8}>
              <Button type="submit">Connect</Button>
            </Col>
          </FormGroup>
        </Form>
      );
    }

    return this.loadingSpinner();
  }

  connectionForm() {
    const {ip, current} = this.state;

    if (ip) {
      return (
        <Form horizontal onSubmit={this.handleDisconnection}>
          <FormGroup>
            <Col componentClass={ControlLabel} md={4}>
              Network
            </Col>
            <Col md={8}>
              <FormControl disabled value={current || 'Not connected'} />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} md={4}>
              IP
            </Col>
            <Col md={8}>
              <FormControl disabled value={ip} />
            </Col>
          </FormGroup>
          {current && (
            <FormGroup>
              <Col mdOffset={4} md={8}>
                <Button type="submit">Disconnect</Button>
              </Col>
            </FormGroup>
          )}
        </Form>
      );
    }

    return this.loadingSpinner();
  }

  render() {
    return (
      <Row>
        <Col sm={6}>
          <h4>Wifi Status</h4>
          {this.connectionForm()}
        </Col>
        <Col sm={6}>
          <h4>Networks</h4>
          {this.connectForm()}
        </Col>
      </Row>
    );
  }
}

export default Connection;
