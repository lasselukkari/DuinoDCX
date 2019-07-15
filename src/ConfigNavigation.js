import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {withBreakpoints} from 'react-breakpoints';
import {Navbar} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import Config from './Config';
import DeviceSelect from './DeviceSelect';
import Localization from './Localization';

class ConfigNavigation extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {device, devices, free, currentBreakpoint} = this.props;
    const {showModal} = this.state;

    return !(
      isEqual(device, nextProps.device) &&
      isEqual(devices, nextProps.devices) &&
      free === nextProps.free &&
      showModal === nextState.showModal &&
      currentBreakpoint === nextProps.currentBreakpoint
    );
  }

  handleShowModal = showModal => {
    this.setState({showModal});
  };

  render() {
    const {
      device,
      devices,
      selected,
      free,
      onChange,
      onSelectDevice,
      currentBreakpoint
    } = this.props;
    const xs = currentBreakpoint === 'xs';

    return (
      <Navbar
        fixed={xs ? 'top' : 'bottom'}
        bg="primary"
        variant="dark"
        className="wide-nav justify-content-end"
      >
        {devices.length > 0 && free && (
          <DeviceSelect
            devices={devices}
            selected={selected}
            free={free}
            xs={xs}
            onSelect={onSelectDevice}
          />
        )}
        {device && device.ready && (
          <Localization setup={device.setup} xs={xs} onChange={onChange} />
        )}
        <Config xs={xs} />
      </Navbar>
    );
  }
}

ConfigNavigation.defaultProps = {
  device: {
    ready: false,
    setup: {}
  },
  devices: [],
  selected: null,
  free: null
};

ConfigNavigation.propTypes = {
  device: PropTypes.shape({
    ready: PropTypes.bool,
    setup: PropTypes.object
  }),
  devices: PropTypes.array,
  selected: PropTypes.number,
  free: PropTypes.number,
  currentBreakpoint: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSelectDevice: PropTypes.func.isRequired
};

export default withBreakpoints(ConfigNavigation);
