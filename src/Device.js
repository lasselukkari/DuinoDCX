import React, {Component} from 'react';
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
          <h5 className="text-center">Searching for devices...</h5>
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
export default Device;
