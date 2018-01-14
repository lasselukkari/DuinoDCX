import React, {Component} from 'react';
import {Panel, Row, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import pc from './parameters';

class Limiter extends Component {
  shouldComponentUpdate(nextProps) {
    const {channel} = this.props;
    return !isEqual(channel, nextProps.channel);
  }

  render() {
    const {channel, channelId, onChange, group} = this.props;
    const {channelName, limiter, limiterThreshold, limiterRelease} = channel;

    return (
      <Panel header={channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}>
        <Row>
          <Col xs={6}>
            <pc.Limiter
              value={limiter}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          </Col>
          <Col xs={6}>
            <pc.LimiterRelease
              value={limiterRelease}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          </Col>
        </Row>
        <pc.LimiterThreshold
          value={limiterThreshold}
          group={group}
          channelId={channelId}
          onChange={onChange}
          includeLabel
        />
      </Panel>
    );
  }
}

export default Limiter;
