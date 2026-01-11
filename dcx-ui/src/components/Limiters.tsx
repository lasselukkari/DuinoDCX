import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'react-fast-compare';
import {type OutputChannel} from 'dcx-parser';
import Limiter from '@/components/Limiter.tsx';

type Props = {
  readonly channels: Record<string, OutputChannel>;
};

function Limiters({channels}: Props) {
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
