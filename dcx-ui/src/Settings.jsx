import React, {PureComponent} from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-spinkit';
import {toast} from 'react-toastify';

class Settings extends PureComponent {
  state = {};
  toastOptions = {position: toast.POSITION.BOTTOM_LEFT};

  componentDidMount() {
    this.fetchSettings();
  }

  async fetchSettings() {
    try {
      const response = await fetch('/api/settings', {
        credentials: 'same-origin'
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const {
        apSsid,
        apPassword,
        auth,
        mdnsHost,
        flowControl,
        autoDisableAP
      } = await response.json();

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
        autoDisableAP,
        loadingDone: true
      });
    } catch {
      toast.error(`Fetching settings failed.`, {
        position: toast.POSITION.BOTTOM_LEFT
      });
    }
  }

  handlePropertyChange(property, event) {
    this.setState({[property]: event.target.value});
  }

  async updateSettings() {
    const {
      username,
      password,
      apSsid,
      apPassword,
      mdnsHost,
      flowControl,
      autoDisableAP
    } = this.state;
    const auth = `Basic ${btoa(`${username}:${password}`)}`;

    const formData = new FormData();
    formData.append('apSsid', apSsid);
    formData.append('apPassword', apPassword);
    formData.append('mdnsHost', mdnsHost);
    formData.append('flowControl', flowControl);
    formData.append('autoDisableAP', autoDisableAP);
    formData.append('auth', auth);
    const data = new URLSearchParams(formData);

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        body: data,
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      toast.info(`Settings saved. Device will reboot now.`, this.toastOptions);
    } catch {
      toast.error(`Failed to update settings`, this.toastOptions);
    }
  }

  handleSubmit = (event) => {
    event.preventDefault();
    this.updateSettings();
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
      autoDisableAP,
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
              onChange={(event) => this.handlePropertyChange('username', event)}
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
              onChange={(event) => this.handlePropertyChange('password', event)}
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
              onChange={(event) => this.handlePropertyChange('apSsid', event)}
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
              onChange={(event) =>
                this.handlePropertyChange('apPassword', event)
              }
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
              onChange={(event) => this.handlePropertyChange('mdnsHost', event)}
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
              onChange={(event) =>
                this.handlePropertyChange('flowControl', event)
              }
            >
              <option value="0">Disabled</option>
              <option value="1">Enabled</option>
            </FormControl>
          </Col>
        </Form.Group>

        <Form.Group as={Row}>
          <Form.Label column sm="5">
            Automatically disable AP
          </Form.Label>
          <Col sm="7">
            <FormControl
              as="select"
              value={autoDisableAP}
              onChange={(event) =>
                this.handlePropertyChange('autoDisableAP', event)
              }
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
