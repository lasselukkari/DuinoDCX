import React, {Component} from 'react';
import {FaGlobe} from 'react-icons/fa';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import Temperature from './Temperature';
import DelayUnits from './DelayUnits';

class Localization extends Component {
  static propTypes = {
    setup: PropTypes.shape({
      airTemperature: PropTypes.number.isRequired,
      isDelayCorrectionOn: PropTypes.bool.isRequired,
      delayUnits: PropTypes.string.isRequired
    }).isRequired,
    isXs: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
  };

  shouldComponentUpdate(nextProps) {
    const {setup, isXs} = this.props;
    return !(isEqual(setup, nextProps.setup) && isXs === nextProps.isXs);
  }

  render() {
    const {onChange, setup, isXs} = this.props;
    const {airTemperature, isDelayCorrectionOn, delayUnits} = setup;

    return (
      <Nav>
        <NavDropdown
          title={<FaGlobe />}
          drop={isXs ? 'down' : 'up'}
          className="no-caret right-0 icon-menu"
        >
          <div id="localization-dropup">
            <Temperature
              airTemperature={airTemperature}
              isDelayCorrectionOn={isDelayCorrectionOn}
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

export default Localization;
