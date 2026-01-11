import React, {useMemo} from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'react-fast-compare';
import {type OutputChannel} from 'dcx-parser';
import ChannelName from '@/components/ChannelName.tsx';

type Props = {
  readonly channels: Record<string, OutputChannel>;
};

function ChannelNames({channels}: Props) {
  const channelIds = useMemo(() => Object.keys(channels), [channels]);

  return (
    <Card>
      <Card.Header>Output Names</Card.Header>
      <Card.Body>
        <Row>
          {channelIds.map((channelId) => {
            return (
              <Col key={channelId} xs={12} sm={6} md={4}>
                <ChannelName
                  key={channelId}
                  channelId={channelId}
                  channelName={channels[channelId].channelName ?? ''}
                />
              </Col>
            );
          })}
        </Row>
      </Card.Body>
    </Card>
  );
}

export default React.memo(ChannelNames, (previousProps, nextProps) => {
  return isEqual(previousProps.channels, nextProps.channels);
});
