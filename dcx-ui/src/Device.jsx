import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Spinner from 'react-spinkit';
import isEqual from 'lodash.isequal';
import Outputs from './Outputs';
import Inputs from './Inputs';

class Device extends Component {
  static defaultProps = {
    device: {
      isReady: false,
      inputs: null,
      outputs: null,
      setup: null
    }
  };

  static propTypes = {
    isBlocking: PropTypes.bool.isRequired,
    page: PropTypes.string.isRequired,
    device: PropTypes.shape({
      isReady: PropTypes.bool,
      inputs: PropTypes.object,
      outputs: PropTypes.object,
      setup: PropTypes.object
    }),
    onChange: PropTypes.func.isRequired
  };

  state = {};

  shouldComponentUpdate(nextProps) {
    const {device, isBlocking, page} = this.props;
    return !(
      isEqual(device, nextProps.device) &&
      isBlocking === nextProps.isBlocking &&
      page === nextProps.page
    );
  }

  render() {
    const {isBlocking, device, onChange, page} = this.props;
    const displayIfPage = (name, exected) => ({
      display: name === exected ? 'block' : 'none'
    });

    if (!device || !device.isReady) {
      return (
        <div className="text-center content-loader" alt="loading">
          <Spinner fadeIn="none" name="line-scale" color="#3498DB" />
          <h5 className="text-center">Searching…</h5>
        </div>
      );
    }

    return (
      <div className="container">
        <div style={displayIfPage(page, 'inputs')}>
          <Inputs
            channels={device.inputs}
            setup={device.setup}
            isBlocking={isBlocking}
            onChange={onChange}
          />
        </div>
        <div style={displayIfPage(page, 'outputs')}>
          <Outputs
            channels={device.outputs}
            setup={device.setup}
            isBlocking={isBlocking}
            onChange={onChange}
          />
        </div>
      </div>
    );
  }
}

export default Device;
