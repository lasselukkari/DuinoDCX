import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Spinner from 'react-spinkit';
import isEqual from 'lodash.isequal';

import Inputs from './Inputs';
import Outputs from './Outputs';

class Device extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  shouldComponentUpdate(nextProps) {
    const {device, blocking, page} = this.props;
    return !(
      isEqual(device, nextProps.device) &&
      blocking === nextProps.blocking &&
      page === nextProps.page
    );
  }

  render() {
    const {blocking, device, onChange, page} = this.props;
    const displayIfPage = (name, exected) => ({
      display: name === exected ? 'block' : 'none'
    });

    if (!device || !device.ready) {
      return (
        <div className="text-center content-loader" alt="loading">
          <Spinner fadeIn="none" name="line-scale" color="#3498DB" />
          <h5 className="text-center">Searching...</h5>
        </div>
      );
    }

    return (
      <div className="container">
        <div style={displayIfPage(page, 'inputs')}>
          <Inputs
            channels={device.inputs}
            setup={device.setup}
            blocking={blocking}
            onChange={onChange}
          />
        </div>
        <div style={displayIfPage(page, 'outputs')}>
          <Outputs
            channels={device.outputs}
            setup={device.setup}
            blocking={blocking}
            onChange={onChange}
          />
        </div>
      </div>
    );
  }
}

Device.defaultProps = {
  device: {
    ready: false,
    inputs: null,
    outputs: null,
    setup: null
  }
};

Device.propTypes = {
  blocking: PropTypes.bool.isRequired,
  page: PropTypes.string.isRequired,
  device: PropTypes.shape({
    ready: PropTypes.bool,
    inputs: PropTypes.object,
    outputs: PropTypes.object,
    setup: PropTypes.object
  }),
  onChange: PropTypes.func.isRequired
};

export default Device;
