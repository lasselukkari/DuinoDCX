import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'react-fast-compare';
import {type OutputChannel} from 'dcx-parser';
import Phase from '@/components/Phase.tsx';

type Props = {
  readonly channels: Record<string, OutputChannel>;
};

function Phases({channels}: Props) {
  return (
    <Row className="show-grid">
      {Object.keys(channels).map((channelId) => {
        const {channelName, polarity, phase} = channels[channelId];
        return (
          <Col key={channelId} xs={12} md={6}>
            <Phase
              key={channelId}
              channelId={channelId}
              channelName={channelName}
              polarity={polarity ?? '0'}
              phase={phase ?? 0}
            />
          </Col>
        );
      })}
    </Row>
  );
}

export default React.memo(Phases, (previousProps, nextProps) => {
  return isEqual(previousProps.channels, nextProps.channels);
});
