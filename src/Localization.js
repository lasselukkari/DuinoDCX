import React, {Component} from 'react';
import {Nav, NavDropdown, Glyphicon} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import Temperature from './Temperature';
import DelayUnits from './DelayUnits';

class Localization extends Component {
  shouldComponentUpdate(nextProps) {
    const {setup} = this.props;
    return isEqual(setup, nextProps.setup);
  }

  render() {
    const {onChange, setup} = this.props;
    const {airTemperature, delayCorrection, delayUnits} = setup;

    return (
      <Nav pullRight>
        <NavDropdown
          noCaret
          title={<Glyphicon glyph="globe" />}
          id="localization-dropdown"
        >
          <Temperature
            airTemperature={airTemperature}
            delayCorrection={delayCorrection}
            delayUnits={delayUnits}
            onChange={onChange}
          />

          <DelayUnits delayUnits={delayUnits} onChange={onChange} />
        </NavDropdown>
      </Nav>
    );
  }
}

export default Localization;
