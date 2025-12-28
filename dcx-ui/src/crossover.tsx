import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import FormLabel from 'react-bootstrap/FormLabel';
import Row from 'react-bootstrap/Row';
import pc from './parameters/index.tsx';

type Props = {
  readonly channelName?: string;
  readonly channelId: string;
  readonly group: string;
  readonly highpassFilter?: string;
  readonly highpassFrequency?: number;
  readonly lowpassFilter?: string;
  readonly lowpassFrequency?: number;
};

function Crossover({
  highpassFilter,
  highpassFrequency,
  lowpassFilter,
  lowpassFrequency,
  channelName,
  group,
  channelId,
}: Props) {
  return (
    <Card>
      <Card.Header>
        {channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}
      </Card.Header>
      <Card.Body>
        <FormLabel>Highpass Filter</FormLabel>
        <Row>
          <Col xs={6}>
            <pc.HighpassFilter
              value={highpassFilter ?? 'OFF'}
              group={group}
              channelId={channelId}
            />
          </Col>
          <Col xs={6}>
            <pc.HighpassFrequency
              value={highpassFrequency ?? 20}
              group={group}
              channelId={channelId}
            />
          </Col>
        </Row>
        <FormLabel>Lowpass Filter</FormLabel>
        <Row>
          <Col xs={6}>
            <pc.LowpassFilter
              value={lowpassFilter ?? 'OFF'}
              group={group}
              channelId={channelId}
            />
          </Col>
          <Col xs={6}>
            <pc.LowpassFrequency
              value={lowpassFrequency ?? 20}
              group={group}
              channelId={channelId}
            />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

export default Crossover;
