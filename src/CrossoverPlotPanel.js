import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import CrossoverPlot from './plots/CrossoverPlot';

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
      <Card>
        <Card.Header>
          Crossover Frequency Response
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
          <CrossoverPlot channels={channels} applyGain={this.state.applyGain} />
        </Card.Body>
      </Card>
    );
  }
}

CrossoverPlotPanel.propTypes = {
  channels: PropTypes.object.isRequired
};

export default CrossoverPlotPanel;
