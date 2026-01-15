import {useState, useCallback} from 'react';
import Button from 'react-bootstrap/Button';
import {FaCog} from 'react-icons/fa';
import Modal from 'react-bootstrap/Modal';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import {useRouter} from '@tanstack/react-router';
import {buildSearchCommand} from 'dcx-parser';
import Connection from '@/connection.tsx';
import Settings from '@/components/Settings.tsx';
import Upload from '@/components/Upload.tsx';

type ConfigProps = {
  readonly isXs: boolean;
};

function Config({isXs}: ConfigProps) {
  const router = useRouter();
  const {connection} = router.options.context;
  const [showModal, setShowModal] = useState<string | false>(false);

  const handleShowModal = useCallback((modal: string | false) => {
    setShowModal(modal);
  }, []);

  const handleRescan = useCallback(() => {
    if (connection) {
      // Send search command to trigger device discovery
      const searchCmd = buildSearchCommand();
      void connection.send(searchCmd);
    }
  }, [connection]);

  return (
    <Nav>
      <NavDropdown
        title={<FaCog />}
        id="nav-dropdown"
        drop={isXs ? 'down' : 'up'}
        className="no-caret right-0 icon-menu"
      >
        <NavDropdown.Item
          eventKey="connection"
          onClick={() => {
            handleShowModal('connection');
          }}
        >
          Wifi Setup
        </NavDropdown.Item>
        <NavDropdown.Item
          eventKey="settings"
          onClick={() => {
            handleShowModal('settings');
          }}
        >
          Settings
        </NavDropdown.Item>
        <NavDropdown.Item
          eventKey="upload"
          onClick={() => {
            handleShowModal('upload');
          }}
        >
          Firmware Update
        </NavDropdown.Item>
        <NavDropdown.Divider />
        <NavDropdown.Item eventKey="rescan" onClick={handleRescan}>
          Rescan Devices
        </NavDropdown.Item>
      </NavDropdown>
      <Modal
        show={showModal === 'connection'}
        onHide={() => {
          handleShowModal(false);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Wifi Setup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Connection />
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => {
              handleShowModal(false);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={showModal === 'settings'}
        onHide={() => {
          handleShowModal(false);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Settings />
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => {
              handleShowModal(false);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={showModal === 'upload'}
        onHide={() => {
          handleShowModal(false);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Firmware Update</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Upload />
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => {
              handleShowModal(false);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Nav>
  );
}

export default Config;
