import React, {Component} from 'react';
import Col from 'react-bootstrap/Col';
import PropTypes from 'prop-types';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import Crossover from './Crossover';

class Crossovers extends Component {
  static propTypes = {
    group: PropTypes.string.isRequired,
    channels: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  shouldComponentUpdate(nextProps) {
    const {channels} = this.props;
    return !isEqual(channels, nextProps.channels);
  }

  render() {
    const {channels, onChange, group} = this.props;
    return (
      <div>
        <Row className="show-grid">
          {Object.keys(channels).map((channelId) => {
            const {
              highpassFilter,
              highpassFrequency,
              lowpassFilter,
              lowpassFrequency,
              channelName
            } = channels[channelId];
            return (
              <Col key={channelId} xs={12} sm={6} md={4}>
                <Crossover
                  group={group}
                  channelId={channelId}
                  highpassFilter={highpassFilter}
                  highpassFrequency={highpassFrequency}
                  lowpassFilter={lowpassFilter}
                  lowpassFrequency={lowpassFrequency}
                  channelName={channelName}
                  onChange={onChange}
                />
              </Col>
            );
          })}
        </Row>
      </div>
    );
  }
}

export default Crossovers;
