import {
  base64ToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToString,
  stringToUint8Array,
} from 'uint8array-extras';
import React, {useState, useEffect} from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import {toast} from 'react-toastify';

function Settings() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apSsid, setApSsid] = useState('');
  const [apPassword, setApPassword] = useState('');
  const [mdnsHost, setMdnsHost] = useState('');
  const [flowControl, setFlowControl] = useState('0');
  const [autoDisableAp, setAutoDisableAp] = useState('0');
  const [loadingDone, setLoadingDone] = useState(false);

  const toastOptions = {position: 'bottom-left' as const};

  useEffect(() => {
    void fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        credentials: 'same-origin',
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const data = (await response.json()) as {
        apSsid: string;
        apPassword: string;
        auth: string;
        mdnsHost: string;
        flowControl: string;
        autoDisableAp: string;
      };
      const {apSsid, apPassword, auth, mdnsHost, flowControl, autoDisableAp} =
        data;

      const authData = auth.replace('Basic ', '');
      const basicAuth = uint8ArrayToString(base64ToUint8Array(authData)).split(
        ':',
      );
      setUsername(basicAuth[0]);
      setPassword(basicAuth[1]);
      setApSsid(apSsid);
      setApPassword(apPassword);
      setMdnsHost(mdnsHost);
      setFlowControl(flowControl);
      setAutoDisableAp(autoDisableAp);
      setLoadingDone(true);
    } catch {
      toast.error(`Fetching settings failed.`, {
        position: 'bottom-left',
      });
    }
  };

  const updateSettings = async () => {
    const auth = `Basic ${uint8ArrayToBase64(stringToUint8Array(`${username}:${password}`))}`;

    const formData = new FormData();
    formData.append('apSsid', apSsid);
    formData.append('apPassword', apPassword);
    formData.append('mdnsHost', mdnsHost);
    formData.append('flowControl', flowControl);
    formData.append('autoDisableAp', autoDisableAp);
    formData.append('auth', auth);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const data = new URLSearchParams(formData as any);

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        body: data,
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      toast.info(`Settings saved. Device will reboot now.`, toastOptions);
    } catch {
      toast.error(`Failed to update settings`, toastOptions);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void updateSettings();
  };

  const isFormValid = () => {
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
  };

  if (!loadingDone) {
    return (
      <div className="text-center content-loader">
        <Spinner animation="grow" variant="primary" />
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group as={Row}>
        <Form.Label column sm="5">
          Username
        </Form.Label>
        <Col sm="7">
          <FormControl
            value={username}
            placeholder="Max 32 chars"
            isInvalid={username.length > 32}
            onChange={(event) => {
              setUsername(event.target.value);
            }}
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
            onChange={(event) => {
              setPassword(event.target.value);
            }}
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
            isInvalid={apSsid.length === 0 || apSsid.length > 32}
            onChange={(event) => {
              setApSsid(event.target.value);
            }}
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
            onChange={(event) => {
              setApPassword(event.target.value);
            }}
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
            isInvalid={mdnsHost.length === 0 || mdnsHost.length > 32}
            onChange={(event) => {
              setMdnsHost(event.target.value);
            }}
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
            onChange={(event) => {
              setFlowControl(event.target.value);
            }}
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
            value={autoDisableAp}
            onChange={(event) => {
              setAutoDisableAp(event.target.value);
            }}
          >
            <option value="0">Disabled</option>
            <option value="1">Enabled</option>
          </FormControl>
        </Col>
      </Form.Group>

      <Button className="w-100" type="submit" disabled={!isFormValid()}>
        Save
      </Button>
    </Form>
  );
}

export default Settings;
