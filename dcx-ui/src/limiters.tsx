import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import Limiter from './limiter.tsx';
import {type Channel} from './dcx2496/parser.ts';

type ChangeEventArgs = {
  param: string;
  group?: string;
  channelId?: string;
  value: boolean | number | string;
};

type Props = {
  readonly channels: Record<string, Channel>;
  readonly group: string;
  readonly onChange: (args: ChangeEventArgs) => void;
};

function Limiters({channels, onChange, group}: Props) {
  return (
    <Row className="show-grid">
      {Object.keys(channels).map((channelId) => {
        const {channelName, isLimiterOn, limiterThreshold, limiterRelease} =
          channels[channelId];
        return (
          <Col key={channelId} xs={12} sm={12} md={6}>
            <Limiter
              key={channelId}
              channel={channels[channelId]}
              channelId={channelId}
              group={group}
              channelName={channelName}
              isLimiterOn={isLimiterOn}
              limiterThreshold={limiterThreshold}
              limiterRelease={limiterRelease}
              onChange={onChange}
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
