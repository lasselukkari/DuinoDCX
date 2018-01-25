import React, {PureComponent} from 'react';
import {Panel, Row, Col} from 'react-bootstrap';

import pc from './parameters';

class Limiter extends PureComponent {
  render() {
    const {channelName, limiter, limiterThreshold, limiterRelease, channelId, onChange, group} = this.props;

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
