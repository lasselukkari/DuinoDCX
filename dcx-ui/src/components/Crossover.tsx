import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import FormLabel from 'react-bootstrap/FormLabel';
import Row from 'react-bootstrap/Row';
import {output, type OutputId} from '@/components/parameters/index.tsx';

type Props = {
  readonly channelName?: string;
  readonly channelId: string;
  readonly highpassFilter?: string;
  readonly highpassFrequency?: string;
  readonly lowpassFilter?: string;
  readonly lowpassFrequency?: string;
};

function Crossover({
  highpassFilter,
  highpassFrequency,
  lowpassFilter,
  lowpassFrequency,
  channelName,
  channelId,
}: Props) {
  const id = channelId as OutputId;

  return (
    <Card>
      <Card.Header>
        {channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}
      </Card.Header>
      <Card.Body>
        <FormLabel>Highpass Filter</FormLabel>
        <Row>
          <Col xs={6}>
            <output.HighpassFilter value={highpassFilter ?? 'OFF'} id={id} />
          </Col>
          <Col xs={6}>
            <output.HighpassFrequency
              value={highpassFrequency ?? '20'}
              id={id}
            />
          </Col>
        </Row>
        <FormLabel>Lowpass Filter</FormLabel>
        <Row>
          <Col xs={6}>
            <output.LowpassFilter value={lowpassFilter ?? 'OFF'} id={id} />
          </Col>
          <Col xs={6}>
            <output.LowpassFrequency value={lowpassFrequency ?? '20'} id={id} />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

export default Crossover;
