import React, {Component} from 'react';
import {Row, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import Limiter from './Limiter';

class Limiters extends Component {
  shouldComponentUpdate(nextProps) {
    const {channels} = this.props;
    return !isEqual(channels, nextProps.channels);
  }

  render() {
    const {channels, onChange, group} = this.props;

    return (
      <Row className="show-grid">
        {Object.keys(channels).map(channelId => {
          return (
            <Col key={channelId} xs={12} sm={12} md={6}>
              <Limiter
                key={channelId}
                channel={channels[channelId]}
                channelId={channelId}
                group={group}
                onChange={onChange}
              />
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default Limiters;
