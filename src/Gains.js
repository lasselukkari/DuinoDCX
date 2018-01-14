import React, {Component} from 'react';
import {Row, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';
import Gain from './Gain';

class Gains extends Component {
  shouldComponentUpdate(nextProps) {
    const {channels} = this.props;
    return !isEqual(channels, nextProps.channels);
  }

  render() {
    const {channels, group, onChange, xs, sm, md, lg} = this.props;

    return (
      <Row className="show-grid">
        {Object.keys(channels).map(channelId => {
          return (
            <Col key={channelId} xs={xs} sm={sm} md={md} lg={lg}>
              <Gain
                key={channelId}
                channel={channels[channelId]}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default Gains;
