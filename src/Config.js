import React, {PureComponent} from 'react';
import Button from 'react-bootstrap/Button';
import {FaCog} from 'react-icons/fa';
import Modal from 'react-bootstrap/Modal';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import PropTypes from 'prop-types';
import Connection from './Connection';
import Settings from './Settings';
import Upload from './Upload';

class Config extends PureComponent {
  static propTypes = {
    isXs: PropTypes.bool.isRequired
  };

  state = {};

  handleShowModal = (showModal) => {
    this.setState({showModal});
  };

  render() {
    const {isXs} = this.props;
    const {showModal} = this.state;

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
            onSelect={() => this.handleShowModal('connection')}
          >
            Wifi Setup
          </NavDropdown.Item>
          <NavDropdown.Item
            eventKey="settings"
            onSelect={() => this.handleShowModal('settings')}
          >
            Settings
          </NavDropdown.Item>
          <NavDropdown.Item
            eventKey="upload"
            onSelect={() => this.handleShowModal('upload')}
          >
            Firmware Update
          </NavDropdown.Item>
        </NavDropdown>
        <Modal
          show={showModal === 'connection'}
          onHide={() => this.handleShowModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Wifi Setup</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Connection />
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => this.handleShowModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={showModal === 'settings'}
          onHide={() => this.handleShowModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Settings</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Settings />
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => this.handleShowModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={showModal === 'upload'}
          onHide={() => this.handleShowModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Firmware Update</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Upload />
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => this.handleShowModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </Nav>
    );
  }
}

export default Config;
