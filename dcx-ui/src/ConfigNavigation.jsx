import React, {Component} from 'react';
import Navbar from 'react-bootstrap/Navbar';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import {withBreakpoints} from 'react-breakpoints';
import Localization from './Localization';
import DeviceSelect from './DeviceSelect';
import Config from './Config';

class ConfigNavigation extends Component {
  static defaultProps = {
    device: {
      isReady: false,
      setup: {}
    },
    devices: [],
    selected: null,
    free: null
  };

  static propTypes = {
    device: PropTypes.shape({
      isReady: PropTypes.bool,
      setup: PropTypes.object
    }),
    devices: PropTypes.array,
    selected: PropTypes.number,
    free: PropTypes.number,
    currentBreakpoint: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onSelectDevice: PropTypes.func.isRequired
  };

  state = {};

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

  handleShowModal = (showModal) => {
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
    const isXs = currentBreakpoint === 'xs';

    return (
      <Navbar
        fixed={isXs ? 'top' : 'bottom'}
        bg="primary"
        variant="dark"
        className="wide-nav justify-content-end"
      >
        {devices.length > 0 && free && (
          <DeviceSelect
            devices={devices}
            selected={selected}
            free={free}
            isXs={isXs}
            onSelect={onSelectDevice}
          />
        )}
        {device && device.isReady && (
          <Localization setup={device.setup} isXs={isXs} onChange={onChange} />
        )}
        <Config isXs={isXs} />
      </Navbar>
    );
  }
}

export default withBreakpoints(ConfigNavigation);
