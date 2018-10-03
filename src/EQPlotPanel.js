import React, {Component} from 'react';
import {Panel, Button} from 'react-bootstrap';
import isEqual from 'lodash.isequal';
import EQPlot from './plots/EQPlot';

class CrossoverPlotPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      applyGain: false
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {channels} = this.props;
    const {applyGain} = this.state;
    return !(
      applyGain === nextState.applyGain && isEqual(channels, nextProps.channels)
    );
  }

  handleToggleGain = () => {
    this.setState(prevState => ({
      applyGain: !prevState.applyGain
    }));
  };

  render() {
    const {channels} = this.props;
    return (
      <Panel>
        <Panel.Heading>
          EQ Frequency Response: All Outputs
          <Button
            bsSize="xs"
            className="pull-right"
            bsStyle={this.state.applyGain ? 'success' : 'default'}
            onClick={this.handleToggleGain}
          >
            Apply Gain
          </Button>
        </Panel.Heading>
        <Panel.Body>
          <EQPlot channels={channels} applyGain={this.state.applyGain} />
        </Panel.Body>
      </Panel>
    );
  }
}

export default CrossoverPlotPanel;
