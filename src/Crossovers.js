import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Row, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import Crossover from './Crossover';

class Crossovers extends Component {
  shouldComponentUpdate(nextProps) {
    const {channels} = this.props;
    return !isEqual(channels, nextProps.channels);
  }

  render() {
    const {channels, onChange, group} = this.props;
    return (
      <div>
        <Row className="show-grid">
          {Object.keys(channels).map(channelId => {
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

Crossovers.propTypes = {
  group: PropTypes.string.isRequired,
  channels: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default Crossovers;
