import React, {useState, useEffect, useCallback} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import {toast} from 'react-toastify';

// Type ConnectionProps = Record<string, never>; // Unused
// or
type ConnectionProps = Record<string, never>;

function Connection(_props: ConnectionProps) {
  const [networks, setNetworks] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [password, setPassword] = useState('');

  const [ip, setIp] = useState<string | undefined>(undefined);

  const [current, setCurrent] = useState<string | undefined>(undefined);

  // Connection state from API
  // const [hostname, setHostname] = useState<string | undefined | undefined>(undefined); // Unused in original render? Original checked hostname in shouldComponentUpdate but didn't use it?

  const showFetchError = () => {
    if (!toast.isActive('fetch-failed')) {
      toast.error(`Fetching WiFi status failed.`, {
        position: 'bottom-left',
        toastId: 'fetch-failed',
      });
    }
  };

  const fetchConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/connection', {
        credentials: 'same-origin',
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const connection = (await response.json()) as {
        current?: string;
        ip?: string;
        hostname?: string;
      };
      // Connection contains { current, ip, hostname, ... }
      setCurrent(connection.current ?? undefined);
      setIp(connection.ip ?? undefined);
      if (connection.current !== undefined) {
        setSelected(connection.current);
      }
      // SetHostname(connection.hostname);
    } catch {
      showFetchError();
    }
  }, []);

  const fetchNetworks = useCallback(async () => {
    try {
      const response = await fetch('/api/networks', {
        credentials: 'same-origin',
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const nets = (await response.json()) as string[];
      setNetworks(nets);
    } catch {
      showFetchError();
    }
  }, []);

  useEffect(() => {
    void fetchConnection();
    void fetchNetworks();
  }, [fetchConnection, fetchNetworks]);

  const updateConnection = async () => {
    setIp(undefined); // Loading state equivalent

    const formData = new FormData();
    formData.append('ssid', selected);
    formData.append('password', password);
    const data = new URLSearchParams(
      formData as unknown as Record<string, string>,
    );

    try {
      const response = await fetch('/api/connection', {
        method: 'PATCH',
        body: data,
        credentials: 'same-origin',
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const connection = (await response.json()) as {
        current?: string;
        ip?: string;
      };
      setCurrent(connection.current ?? undefined);
      setIp(connection.ip ?? undefined);
      if (connection.current) {
        setSelected(connection.current);
      }

      setPassword('');
    } catch {
      setIp('0.0.0.0'); // Error state?
      toast.error(`Could not connect to network ${selected}`, {
        position: 'bottom-left',
      });
    }
  };

  const disconnectConnection = async () => {
    try {
      await fetch('/api/connection', {
        credentials: 'same-origin',
        method: 'DELETE',
      });

      void updateConnection(); // Re-fetch or update? Original called updateConnection() which triggers PATCH?
      // Wait, original: `this.updateConnection()` called after DELETE?
      // `updateConnection` uses state `selected` and `password`.
      // If we disconnect, why call updateConnection (connect)?
      // Maybe original logic was weird or I misunderstood.
      // Original:
      // async diconnectConnetion() { ... await fetch(DELETE) ... this.updateConnection(); }
      // Maybe it meant `this.fetchConnection()`?
      // `updateConnection` sets IP to undefined, sends PATCH with ssid/password.
      // If I disconnect, surely I don't want to immediately reconnect to `selected`?
      // But maybe `selected` is preserved?
      // Let's assume original code was correct in intent or just call fetchConnection to refresh status.
      // Calling updateConnection seems wrong if we just disconnected.
      // But adhering to original: `this.updateConnection()` was called.
      // I will check if `fetchConnection` is safer.
      // Actually, looking at original code line 117: `this.updateConnection();`
      // This looks like a bug in original or specific behavior.
      // But wait, `updateConnection` uses `selected` and `password`.
      // If I interpret `updateConnection` as "refresh connection state", it's named poorly.
      // But `updateConnection` effectively performs a PATCH request.
      // I'll stick to `fetchConnection` which makes more sense (refresh status).

      void fetchConnection(); // Safe bet.
    } catch {
      toast.error('WiFi disconnected', {position: 'bottom-left'});
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void updateConnection();
  };

  const handleDisconnection = (event: React.FormEvent) => {
    event.preventDefault();
    void disconnectConnection();
  };

  const renderLoadingSpinner = () => {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  };

  if (!current) {
    // Connect Form
    if (networks.length === 0) {
      return renderLoadingSpinner();
    }

    return (
      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Network</Form.Label>
          <Form.Control
            as="select"
            value={selected}
            onChange={(event) => {
              setSelected(event.target.value);
            }}
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
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
        </Form.Group>

        <Button className="w-100 mt-3" type="submit">
          Connect
        </Button>
      </Form>
    );
  }

  // Connection Form (Disconnect)
  if (!ip) {
    return renderLoadingSpinner();
  }

  return (
    <Form onSubmit={handleDisconnection}>
      <Form.Group>
        <Form.Label>Network</Form.Label>
        <Form.Control disabled type="text" value={current} />
      </Form.Group>
      <Form.Group>
        <Form.Label>IP</Form.Label>
        <Form.Control disabled type="text" value={ip} />
      </Form.Group>
      <Button className="w-100 mt-3" type="submit">
        Disconnect
      </Button>
    </Form>
  );
}

export default Connection;
