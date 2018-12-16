import React, {PureComponent} from 'react';
import {
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

class Settings extends PureComponent {
  constructor() {
    super();
    this.state = {};
  }

  fetchSettings() {
    return fetch('/api/settings', {credentials: 'same-origin'})
      .then(handleFetchErrors)
      .then(response => response.json())
      .then(settings => {
        const {apSsid, apPassword, auth, mdnsHost, flowControl} = settings;

        const basicAuth = atob(auth.replace('Basic ', '')).split(':');
        const username = basicAuth[0];
        const password = basicAuth[1];

        this.setState({
          username,
          password,
          apSsid,
          apPassword,
          mdnsHost,
          flowControl,
          loadingDone: true
        });
      });
  }

  componentDidMount() {
    this.fetchSettings().catch(() => {
      toast.error(`Fetching settings failed.`, {
        position: toast.POSITION.BOTTOM_LEFT
      });
    });
  }

  handleUsernameChange = e => {
    const username = e.target.value;
    this.setState({username});
  };

  handlePasswordChange = e => {
    const password = e.target.value;
    this.setState({password});
  };

  handleApSsidChange = e => {
    const apSsid = e.target.value;
    this.setState({apSsid});
  };

  handleApPasswordChange = e => {
    const apPassword = e.target.value;
    this.setState({apPassword});
  };

  handleMdnsHost = e => {
    const mdnsHost = e.target.value;
    this.setState({mdnsHost});
  };

  handleFlowControlChange = e => {
    const flowControl = e.target.value;
    this.setState({flowControl});
  };

  handleSubmit = e => {
    e.preventDefault();

    const {
      username,
      password,
      apSsid,
      apPassword,
      mdnsHost,
      flowControl
    } = this.state;
    const auth = `Basic ${btoa(`${username}:${password}`)}`;

    const formData = new FormData();
    formData.append('apSsid', apSsid);
    formData.append('apPassword', apPassword);
    formData.append('mdnsHost', mdnsHost);
    formData.append('flowControl', flowControl);
    formData.append('auth', auth);
    const data = new URLSearchParams(formData);

    fetch('/api/settings', {
      method: 'PATCH',
      body: data,
      credentials: 'same-origin'
    })
      .then(handleFetchErrors)
      .then(() => {
        toast.info(`Settings updated`, {
          position: toast.POSITION.BOTTOM_LEFT
        });
      })
      .catch(() => {
        toast.error(`Failed to update settings`, {
          position: toast.POSITION.BOTTOM_LEFT
        });
      });
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

  isFormValid() {
    const {username, password, apSsid, apPassword, mdnsHost} = this.state;

    return (
      username.length > 0 &&
      username.length < 32 &&
      password.length > 0 &&
      password.length < 32 &&
      apSsid.length > 0 &&
      apSsid.length < 32 &&
      apPassword.length >= 8 &&
      apPassword.length < 32 &&
      mdnsHost.length > 0 &&
      mdnsHost.length < 32
    );
  }

  render() {
    const {
      username,
      password,
      apSsid,
      apPassword,
      mdnsHost,
      flowControl,
      loadingDone
    } = this.state;

    if (!loadingDone) {
      return this.loadingSpinner();
    }

    return (
      <Form horizontal method="POST" onSubmit={this.handleSubmit}>
        <FormGroup
          validationState={
            username.length > 0 && username.length < 32 ? 'success' : 'error'
          }
        >
          <Col componentClass={ControlLabel} md={4}>
            Username
          </Col>
          <Col md={8}>
            <FormControl
              value={username}
              placeholder="Username"
              onChange={this.handleUsernameChange}
            />
          </Col>
        </FormGroup>
        <FormGroup
          validationState={
            password.length > 0 && password.length < 32 ? 'success' : 'error'
          }
        >
          <Col componentClass={ControlLabel} md={4}>
            Password
          </Col>
          <Col md={8}>
            <FormControl
              value={password}
              placeholder="Password"
              onChange={this.handlePasswordChange}
            />
          </Col>
        </FormGroup>
        <FormGroup
          validationState={
            apSsid.length > 0 && apSsid.length < 32 ? 'success' : 'error'
          }
        >
          <Col componentClass={ControlLabel} md={4}>
            Access Point SSID
          </Col>
          <Col md={8}>
            <FormControl
              value={apSsid}
              placeholder="Access Point SSID"
              onChange={this.handleApSsidChange}
            />
          </Col>
        </FormGroup>
        <FormGroup
          validationState={
            apPassword.length >= 8 && apPassword.length < 32
              ? 'success'
              : 'error'
          }
        >
          <Col componentClass={ControlLabel} md={4}>
            Access Point Password
          </Col>
          <Col md={8}>
            <FormControl
              value={apPassword}
              placeholder="Access Point Password"
              onChange={this.handleApPasswordChange}
            />
          </Col>
        </FormGroup>
        <FormGroup
          validationState={
            mdnsHost.length > 0 && mdnsHost.length < 32 ? 'success' : 'error'
          }
        >
          <Col componentClass={ControlLabel} md={4}>
            MDNS Host Name
          </Col>
          <Col md={8}>
            <FormControl
              value={mdnsHost}
              placeholder="MDNS Host Name"
              onChange={this.handleMdnsHost}
            />
          </Col>
        </FormGroup>
        <FormGroup>
          <Col componentClass={ControlLabel} md={4}>
            Hardware Flow Control
          </Col>
          <Col md={8}>
            <FormControl
              componentClass="select"
              value={flowControl}
              onChange={this.handleFlowControlChange}
            >
              <option value="0">Disabled</option>
              <option value="1">Enabled</option>
            </FormControl>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col mdOffset={4} md={8}>
            <Button type="submit" disabled={!this.isFormValid()}>
              Save
            </Button>
          </Col>
        </FormGroup>
      </Form>
    );
  }
}

export default Settings;
