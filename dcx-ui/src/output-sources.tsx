import {memo} from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import OutputSource from './output-source.tsx';

type ChannelData = {
  channelName?: string;
  source?: number | string;
};

type OutputSourcesProps = {
  readonly channels: Record<string, ChannelData>;
  readonly group: string;
};

function OutputSources({channels, group}: OutputSourcesProps) {
  return (
    <Card>
      <Card.Header>Output Source</Card.Header>
      <Card.Body>
        <Row>
          {Object.keys(channels).map((channelId) => {
            const {channelName, source} = channels[channelId];
            return (
              <Col key={channelId} sm={4} xs={12}>
                <OutputSource
                  key={channelId}
                  group={group}
                  channelId={channelId}
                  channelName={channelName}
                  source={source}
                />
              </Col>
            );
          })}
        </Row>
      </Card.Body>
    </Card>
  );
}

export default memo(OutputSources);
