import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Navbar, Nav, NavDropdown} from 'react-bootstrap';
import {FaSignal, FaLock, FaEdit} from 'react-icons/fa';
import isEqual from 'lodash.isequal';

import ChannelLevels from './ChannelLevels';

class TopNavigation extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {device, blocking, page, inputs, outputs} = this.props;
    const {showLevels} = this.state;

    return !(
      isEqual(device, nextProps.device) &&
      isEqual(inputs, nextProps.inputs) &&
      isEqual(outputs, nextProps.outputs) &&
      blocking === nextProps.blocking &&
      page === nextProps.page &&
      showLevels === nextState.showLevels
    );
  }

  handleLevelsShowChange = (isOpen, event, {source}) => {
    if (source === 'rootClose') {
      this.setState(() => ({showLevels: true}));
    } else {
      this.setState(({showLevels}) => ({showLevels: !showLevels}));
    }
  };

  render() {
    const {showLevels} = this.state;
    const {
      device,
      blocking,
      page,
      inputs,
      outputs,
      onChange,
      onPageChange,
      onBlockingChange
    } = this.props;

    if (!device || !device.ready || !inputs || !outputs) {
      return null;
    }

    return (
      <Navbar fixed="top" bg="primary" variant="dark" className="wide-nav">
        <Nav className="end-button">
          <NavDropdown
            open={showLevels}
            className="channel-levels no-caret"
            title={<FaSignal />}
            id="channel-levels-dropdown"
            onToggle={this.handleLevelsShowChange}
          >
            <ChannelLevels
              device={device}
              inputs={inputs}
              outputs={outputs}
              blocking={blocking}
              onChange={onChange}
            />
          </NavDropdown>
        </Nav>
        <Nav className="middle-buttons" onSelect={onPageChange}>
          <Nav.Item>
            <Nav.Link active={page === 'inputs'} eventKey="inputs">
              Inputs
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={page === 'outputs'} eventKey="outputs">
              Outputs
            </Nav.Link>
          </Nav.Item>
        </Nav>
        <Nav activeKey="blocking" className="end-button">
          <Nav.Item onClick={onBlockingChange}>
            <Nav.Link>
              {' '}
              {blocking ? (
                <FaLock style={{color: '#ee5f5b'}} />
              ) : (
                <FaEdit style={{color: '#62c462'}} />
              )}
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Navbar>
    );
  }
}

TopNavigation.propTypes = {
  device: PropTypes.shape({
    ready: PropTypes.bool
  }).isRequired,
  page: PropTypes.string.isRequired,
  blocking: PropTypes.bool.isRequired,
  inputs: PropTypes.array.isRequired,
  outputs: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onBlockingChange: PropTypes.func.isRequired
};

export default TopNavigation;
