import React, {PureComponent} from 'react';
import {Card, Row, Col} from 'react-bootstrap';

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
      <Card>
        <Card.Header>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col xs={6} md={12} lg={6}>
              <pc.Limiter
                includeLabel
                value={limiter}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col xs={6} md={12} lg={6}>
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
        </Card.Body>
      </Card>
    );
  }
}

export default Limiter;
