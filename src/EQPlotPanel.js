import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
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
    const {channels, group} = this.props;
    return (
      <Card>
        <Card.Header>
          EQ Frequency Response: All{' '}
          {group.charAt(0).toUpperCase() + group.slice(1)}
          <Button
            size="sm"
            className="header-button"
            variant={this.state.applyGain ? 'success' : 'dark'}
            onClick={this.handleToggleGain}
          >
            Apply Gain
          </Button>
        </Card.Header>
        <Card.Body>
          <EQPlot channels={channels} applyGain={this.state.applyGain} />
        </Card.Body>
      </Card>
    );
  }
}

CrossoverPlotPanel.propTypes = {
  channels: PropTypes.object.isRequired,
  group: PropTypes.string.isRequired
};

export default CrossoverPlotPanel;
