import React, {Component} from 'react';
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
            return (
              <Col key={channelId} xs={12} sm={6} md={4} lg={2}>
                <Crossover
                  channel={channels[channelId]}
                  group={group}
                  channelId={channelId}
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
