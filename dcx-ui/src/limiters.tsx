import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import Limiter from './limiter.tsx';
import {type Channel} from './dcx2496/parser.ts';

type Props = {
  readonly channels: Record<string, Channel>;
  readonly group: string;
};

function Limiters({channels, group}: Props) {
  return (
    <Row className="show-grid">
      {Object.keys(channels).map((channelId) => {
        const {channelName, isLimiterOn, limiterThreshold, limiterRelease} =
          channels[channelId];
        return (
          <Col key={channelId} xs={12} sm={12} md={6}>
            <Limiter
              key={channelId}
              channelId={channelId}
              group={group}
              channelName={channelName}
              isLimiterOn={Boolean(isLimiterOn)}
              limiterThreshold={limiterThreshold ?? 0}
              limiterRelease={limiterRelease ?? 0}
            />
          </Col>
        );
      })}
    </Row>
  );
}

export default React.memo(Limiters, (previousProps, nextProps) => {
  return isEqual(previousProps.channels, nextProps.channels);
});
