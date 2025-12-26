import {FaEdit, FaLock, FaSignal} from 'react-icons/fa';
import React, {Component} from 'react';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Navbar from 'react-bootstrap/Navbar';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import {withBreakpoints} from 'react-breakpoints';
import ChannelLevels from './ChannelLevels';

class DeviceNavigation extends Component {
  static propTypes = {
    device: PropTypes.shape({
      isReady: PropTypes.bool
    }).isRequired,
    page: PropTypes.string.isRequired,
    isBlocking: PropTypes.bool.isRequired,
    inputs: PropTypes.array.isRequired,
    outputs: PropTypes.array.isRequired,
    currentBreakpoint: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onPageChange: PropTypes.func.isRequired,
    onBlockingChange: PropTypes.func.isRequired
  };

  state = {};

  shouldComponentUpdate(nextProps, nextState) {
    const {
      device,
      isBlocking,
      page,
      inputs,
      outputs,
      currentBreakpoint
    } = this.props;
    const {showLevels} = this.state;

    return !(
      isEqual(device, nextProps.device) &&
      isEqual(inputs, nextProps.inputs) &&
      isEqual(outputs, nextProps.outputs) &&
      isBlocking === nextProps.isBlocking &&
      page === nextProps.page &&
      showLevels === nextState.showLevels &&
      currentBreakpoint === nextProps.currentBreakpoint
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
      isBlocking,
      page,
      inputs,
      outputs,
      onChange,
      onPageChange,
      onBlockingChange,
      currentBreakpoint
    } = this.props;

    if (!device || !device.isReady || !inputs || !outputs) {
      return null;
    }

    const isXs = currentBreakpoint === 'xs';

    return (
      <Navbar
        fixed={isXs ? 'bottom' : 'top'}
        bg="primary"
        variant="dark"
        className="wide-nav"
      >
        <Nav className="end-button">
          <NavDropdown
            open={showLevels}
            className="channel-levels no-caret"
            title={<FaSignal />}
            id="channel-levels-dropdown"
            drop={isXs ? 'up' : 'down'}
            onToggle={this.handleLevelsShowChange}
          >
            <ChannelLevels
              device={device}
              inputs={inputs}
              outputs={outputs}
              isBlocking={isBlocking}
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
        <Nav activeKey="isBlocking" className="end-button">
          <Nav.Item onClick={onBlockingChange}>
            <Nav.Link>
              {' '}
              {isBlocking ? (
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

export default withBreakpoints(DeviceNavigation);
