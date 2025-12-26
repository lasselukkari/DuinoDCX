import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import CrossoverPlot from './plots/CrossoverPlot';

class CrossoverPlotPanel extends Component {
  static propTypes = {
    channels: PropTypes.object.isRequired
  };

  state = {
    isGainApplied: false
  };

  shouldComponentUpdate(nextProps, nextState) {
    const {channels} = this.props;
    const {isGainApplied} = this.state;
    return !(
      isGainApplied === nextState.isGainApplied &&
      isEqual(channels, nextProps.channels)
    );
  }

  handleToggleGain = () => {
    this.setState((previousState) => ({
      isGainApplied: !previousState.isGainApplied
    }));
  };

  render() {
    const {channels} = this.props;
    return (
      <Card>
        <Card.Header>
          Crossover Frequency Response
          <Button
            size="sm"
            className="header-button"
            variant={this.state.isGainApplied ? 'success' : 'dark'}
            onClick={this.handleToggleGain}
          >
            Apply Gain
          </Button>
        </Card.Header>
        <Card.Body>
          <CrossoverPlot
            channels={channels}
            isGainApplied={this.state.isGainApplied}
          />
        </Card.Body>
      </Card>
    );
  }
}

export default CrossoverPlotPanel;
