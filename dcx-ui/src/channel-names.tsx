import React, {useMemo} from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import ChannelName from './channel-name.tsx';
import {type Channel} from './dcx2496/parser.ts';

type Props = {
  readonly group: string;
  readonly channels: Record<string, Channel>;
};

function ChannelNames({channels, group}: Props) {
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
                  group={group}
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
  return (
    isEqual(previousProps.channels, nextProps.channels) &&
    previousProps.group === nextProps.group
  );
});
