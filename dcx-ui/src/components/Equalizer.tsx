import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import {eq} from '@/components/parameters/index.tsx';

type EqualizerProps = {
  readonly equalizerType: string;
  readonly equalizerFrequency: string;
  readonly equalizerQ: string;
  readonly equalizerShelving: string;
  readonly equalizerGain: number;
  readonly id: string;
  readonly group: 'inputs' | 'outputs';
  readonly channelId: string;
};

function Equalizer({
  equalizerType,
  equalizerFrequency,
  equalizerQ,
  equalizerShelving,
  equalizerGain,
  id,
  group,
  channelId,
}: EqualizerProps) {
  const band = Number(id);

  return (
    <Card>
      <Card.Header>{`Equalizer ${id}`}</Card.Header>
      <Card.Body>
        <Row>
          <Col xs={12} sm={4}>
            <eq.Type
              hasLabel
              value={equalizerType}
              group={group}
              channelId={channelId}
              band={band}
            />
          </Col>
          <Col xs={12} sm={4}>
            <eq.Frequency
              hasLabel
              value={equalizerFrequency}
              group={group}
              channelId={channelId}
              band={band}
            />
          </Col>
          <Col xs={12} sm={4}>
            {equalizerType === 'Bandpass' && (
              <eq.Q
                hasLabel
                value={equalizerQ}
                group={group}
                channelId={channelId}
                band={band}
              />
            )}
            {equalizerType !== 'Bandpass' && (
              <eq.Shelving
                hasLabel
                value={equalizerShelving}
                group={group}
                channelId={channelId}
                band={band}
              />
            )}
          </Col>
        </Row>
        <eq.Gain
          hasLabel
          value={equalizerGain}
          group={group}
          channelId={channelId}
          band={band}
        />
      </Card.Body>
    </Card>
  );
}

export default Equalizer;
