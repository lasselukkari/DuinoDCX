import React, {Component} from 'react';
import {Navbar, Nav, NavDropdown, Glyphicon, NavItem} from 'react-bootstrap';
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
      <Navbar fluid fixedTop className="top-nav" style={{}}>
        <Nav className="end-button">
          <NavDropdown
            noCaret
            open={showLevels}
            activeKey={showLevels}
            className="channel-levels"
            title={<Glyphicon glyph="equalizer" />}
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
        <Nav
          activeKey={page}
          className="middle-buttons"
          onSelect={onPageChange}
        >
          <NavItem eventKey="inputs">Inputs</NavItem>
          <NavItem eventKey="outputs">Outputs</NavItem>
        </Nav>
        <Nav pullRight activeKey="blocking" className="end-button">
          <NavItem
            eventKey={blocking ? 'not-blocking' : 'blocking'}
            onClick={onBlockingChange}
          >
            <Glyphicon
              style={{color: blocking ? '#ee5f5b' : '#62c462'}}
              glyph={blocking ? 'lock' : 'edit'}
            />
          </NavItem>
        </Nav>
      </Navbar>
    );
  }
}

export default TopNavigation;
