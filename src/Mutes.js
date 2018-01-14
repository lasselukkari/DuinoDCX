import React, {Component} from 'react';
import {Row, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';
import Mute from './Mute';

class Gains extends Component {
  shouldComponentUpdate(newProps) {
    const {channels} = this.props;
    return !isEqual(channels, newProps.channels);
  }

  render() {
    const {channels, group, onChange, xs, sm, md, lg} = this.props;

    return (
      <Row className="show-grid">
        {Object.keys(channels).map(channelId => {
          return (
            <Col key={channelId} xs={xs} sm={sm} md={md} lg={lg}>
              <Mute
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
