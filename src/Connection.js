import React, {Component} from 'react';
import isEqual from 'lodash.isequal';
import {Row, Form, FormControl, FormGroup, ControlLabel, Button, Col} from 'react-bootstrap';
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
  }

  updateConnection() {
    return fetch('/api/connection')
      .then(handleFetchErrors)
      .then(response => response.json())
      .then(connection => {
        this.setState(({password, networks}) =>
          ({selected: connection.current, password, networks, ...connection}));
      });
  }

  updateNetworks() {
    return fetch('/api/networks')
      .then(handleFetchErrors)
      .then(response => response.json())
      .then(networks => {
        if (networks.length === 0) {
          return this.updateNetworks();
        }

        this.setState(({password, ip, hostname, current, selected}) =>
          ({password, ip, hostname, current, selected, networks}));
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

  handleNetworkSelect= e => { // eslint-disable-line no-undef
    const selected = e.target.value;
    this.setState(({password, networks, ip, hostname, current}) =>
      ({networks, ip, hostname, selected, password, current}));
  };

  handlePasswordChange= e => { // eslint-disable-line no-undef
    const password = e.target.value;
    this.setState(({selected, networks, ip, hostname, current}) =>
      ({networks, ip, hostname, selected, password, current}));
  };

  handleSubmit= e => { // eslint-disable-line no-undef
    e.preventDefault();
    this.setState(({networks, selected, password, hostname}) =>
      ({networks, selected, password, ip: null, hostname}));

    const {selected, password, networks} = this.state;
    const formData = new FormData();
    formData.append('ssid', selected);
    formData.append('password', password);
    const data = new URLSearchParams(formData);

    fetch('/api/connection', {
      method: 'PATCH',
      body: data
    }).then(handleFetchErrors)
      .then(response => response.json())
      .then(connection => {
        this.setState({networks, ...connection, selected: connection.current, password: ''});
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
              <FormControl value={password} onChange={this.handlePasswordChange} type="password" placeholder="Password"/>
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
      <Row>
        <Col sm={6}>
          <h4>
Status
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
    );
  }
}

export default Connection;
