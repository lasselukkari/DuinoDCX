import React, {PureComponent} from 'react';
import {Panel, Row, Col} from 'react-bootstrap';

import pc from './parameters';

class Limiter extends PureComponent {
  render() {
    const {
      channelName,
      limiter,
      limiterThreshold,
      limiterRelease,
      channelId,
      onChange,
      group
    } = this.props;

    return (
      <Panel>
        <Panel.Heading>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Panel.Heading>
        <Panel.Body>
          <Row>
            <Col xs={6}>
              <pc.Limiter
                includeLabel
                value={limiter}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col xs={6}>
              <pc.LimiterRelease
                includeLabel
                value={limiterRelease}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
          </Row>
          <pc.LimiterThreshold
            includeLabel
            value={limiterThreshold}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
        </Panel.Body>
      </Panel>
    );
  }
}

export default Limiter;
