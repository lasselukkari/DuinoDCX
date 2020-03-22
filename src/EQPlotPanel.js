import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import EQPlot from './plots/EQPlot';

class CrossoverPlotPanel extends Component {
  static propTypes = {
    channels: PropTypes.object.isRequired,
    group: PropTypes.string.isRequired
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
    const {channels, group} = this.props;
    return (
      <Card>
        <Card.Header>
          EQ Frequency Response: All{' '}
          {group.charAt(0).toUpperCase() + group.slice(1)}
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
          <EQPlot
            channels={channels}
            isGainApplied={this.state.isGainApplied}
          />
        </Card.Body>
      </Card>
    );
  }
}

export default CrossoverPlotPanel;
