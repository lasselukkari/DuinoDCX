import React, {Component} from 'react';
import isEqual from 'lodash.isequal';
import {Row, Form, FormControl, FormGroup, ControlLabel, Button, Col} from 'react-bootstrap';
import {toast} from 'react-toastify';
import Spinner from 'react-spinkit';

import Upload from './Upload';

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
      .catch(console.log);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {networks, selected, password, ip, hostname} = this.state;

    return !isEqual(networks, nextState.networks) ||
      selected !== nextState.selected ||
      password !== nextState.password ||
      ip !== nextState.ip ||
      hostname !== nextState.hostname;
  }

  handleNetworkSelect = e => { // eslint-disable-line no-undef
    const selected = e.target.value;
    this.setState({selected});
  };

  handlePasswordChange = e => { // eslint-disable-line no-undef
    const password = e.target.value;
    this.setState({password});
  };

  handleSubmit = e => { // eslint-disable-line no-undef
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
    }).then(handleFetchErrors)
      .then(response => response.json())
      .then(connection => {
        this.setState({...connection, selected: connection.current});
        this.pollWifi();
      }).catch(() => {
        toast.error(`Could not connect to network ${selected}`, {
          position: toast.POSITION.BOTTOM_LEFT
        });
      });
  };

  loadingSpinner() {
    return (<Spinner className="text-center" fadeIn="none" name="line-scale" color="#3498DB"/>);
  }

  connectForm() {
    const {networks, selected, password} = this.state;

    if (networks.length > 0) {
      return (
        <Form onSubmit={this.handleSubmit} method="POST" horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} md={4}>
              Network
            </Col>
            <Col md={8}>
              <FormControl
                componentClass="select"
                onChange={this.handleNetworkSelect}
                value={selected}
              >
                {networks.sort().map(enumeral => (
                  <option key={enumeral}>
                    {enumeral}
                  </option>
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
                onChange={this.handlePasswordChange}
                type="password"
                placeholder="Password"
              />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col mdOffset={4} md={8}>
              <Button type="submit">
                Connect
              </Button>
            </Col>
          </FormGroup>
        </Form>
      );
    }

    return this.loadingSpinner();
  }

  connectionForm() {
    const {ip, current, hostname} = this.state;

    if (ip) {
      return (
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} md={4}>
              Network
            </Col>
            <Col md={8}>
              <FormControl value={current} disabled/>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} md={4}>
              IP
            </Col>
            <Col md={8}>
              <FormControl value={ip} disabled/>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} md={4}>
              Hostname
            </Col>
            <Col md={8}>
              <FormControl value={hostname} disabled/>
            </Col>
          </FormGroup>
        </Form>
      );
    }

    return this.loadingSpinner();
  }

  render() {
    return (
      <div>
        <Row>
          <Col sm={6}>
            <h4>
              Wifi Status
            </h4>
            {this.connectionForm()}
          </Col>
          <Col sm={6}>
            <h4>
              Networks
            </h4>
            {this.connectForm()}
          </Col>
        </Row>
        <hr/>
        <h4>
          Update firmware
        </h4>
        <Upload/>
      </div>
    );
  }
}

export default Connection;
