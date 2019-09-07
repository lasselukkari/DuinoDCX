import React, {PureComponent} from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-spinkit';
import {toast} from 'react-toastify';

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
        toast.info(`Settings saved. Device will reboot now.`, {
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
      username.length < 32 &&
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
      <Form method="POST" onSubmit={this.handleSubmit}>
        <Form.Group as={Row}>
          <Form.Label column sm="5">
            Username
          </Form.Label>
          <Col sm="7">
            <FormControl
              value={username}
              placeholder="Max 32 chars"
              isInvalid={username.length > 32}
              onChange={this.handleUsernameChange}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row}>
          <Form.Label column sm="5">
            Password
          </Form.Label>
          <Col sm="7">
            <FormControl
              value={password}
              placeholder="Max 32 chars"
              isInvalid={password.length > 32}
              onChange={this.handlePasswordChange}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row}>
          <Form.Label column sm="5">
            Access Point SSID
          </Form.Label>
          <Col sm="7">
            <FormControl
              value={apSsid}
              placeholder="Min 1 and max 32 chars"
              isInvalid={apSsid.length < 1 || apSsid.length > 32}
              onChange={this.handleApSsidChange}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row}>
          <Form.Label column sm="5">
            Access Point Password
          </Form.Label>
          <Col sm="7">
            <FormControl
              value={apPassword}
              placeholder="Min 8 and max 32 chars"
              isInvalid={apPassword.length < 8 || apPassword.length > 32}
              onChange={this.handleApPasswordChange}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row}>
          <Form.Label column sm="5">
            MDNS Host Name
          </Form.Label>
          <Col sm="7">
            <FormControl
              value={mdnsHost}
              placeholder="Min 1 and max 32 chars"
              isInvalid={mdnsHost.length < 1 || mdnsHost.length > 32}
              onChange={this.handleMdnsHost}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row}>
          <Form.Label column sm="5">
            Hardware Flow Control
          </Form.Label>
          <Col sm="7">
            <FormControl
              as="select"
              value={flowControl}
              onChange={this.handleFlowControlChange}
            >
              <option value="0">Disabled</option>
              <option value="1">Enabled</option>
            </FormControl>
          </Col>
        </Form.Group>

        <Button block type="submit" disabled={!this.isFormValid()}>
          Save
        </Button>
      </Form>
    );
  }
}

export default Settings;
