import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Nav, NavDropdown} from 'react-bootstrap';
import {FaGlobe} from 'react-icons/fa';
import isEqual from 'lodash.isequal';

import Temperature from './Temperature';
import DelayUnits from './DelayUnits';

class Localization extends Component {
  shouldComponentUpdate(nextProps) {
    const {setup} = this.props;
    return !isEqual(setup, nextProps.setup);
  }

  render() {
    const {onChange, setup} = this.props;
    const {airTemperature, delayCorrection, delayUnits} = setup;

    return (
      <Nav>
        <NavDropdown
          title={<FaGlobe />}
          drop="up"
          className="no-caret right-0 icon-menu"
        >
          <div id="localization-dropup">
            <Temperature
              airTemperature={airTemperature}
              delayCorrection={delayCorrection}
              delayUnits={delayUnits}
              onChange={onChange}
            />

            <DelayUnits delayUnits={delayUnits} onChange={onChange} />
          </div>
        </NavDropdown>
      </Nav>
    );
  }
}

Localization.propTypes = {
  setup: PropTypes.shape({
    airTemperature: PropTypes.number.isRequired,
    delayCorrection: PropTypes.bool.isRequired,
    delayUnits: PropTypes.string.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default Localization;
