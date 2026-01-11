import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'react-fast-compare';
import {type Channel} from 'dcx-parser';
import Gain from '@/components/Gain.tsx';

type Props = {
  readonly group: 'inputs' | 'outputs';
  readonly channels: Record<string, Channel>;
};

function Gains({channels, group}: Props) {
  return (
    <Row className="show-grid">
      {Object.keys(channels).map((channelId) => {
        const ch = channels[channelId];
        const {gain} = ch;
        const {channelName} = ch;
        return (
          <Col key={channelId} xs={12}>
            <Gain
              key={channelId}
              group={group}
              channelId={channelId}
              channelName={channelName}
              gain={gain}
            />
          </Col>
        );
      })}
    </Row>
  );
}

export default React.memo(Gains, (previousProps, nextProps) => {
  return isEqual(previousProps.channels, nextProps.channels);
});
