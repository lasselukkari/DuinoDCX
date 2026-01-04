import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import pc from './parameters/index.tsx';

type EqualizerProps = {
  readonly equalizerType: string;
  readonly equalizerFrequency: number | string;
  readonly equalizerQ: number | string;
  readonly equalizerShelving: string;
  readonly equalizerGain: number | string;
  readonly id: string;
  readonly group: string;
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
  return (
    <Card>
      <Card.Header>{`Equalizer ${id}`}</Card.Header>
      <Card.Body>
        <Row>
          <Col xs={12} sm={4}>
            <pc.EqualizerType
              hasLabel
              value={equalizerType}
              eq={id}
              group={group}
              channelId={channelId}
            />
          </Col>
          <Col xs={12} sm={4}>
            <pc.EqualizerFrequency
              hasLabel
              value={equalizerFrequency}
              eq={id}
              group={group}
              channelId={channelId}
            />
          </Col>
          <Col xs={12} sm={4}>
            {equalizerType === 'Bandpass' && (
              <pc.EqualizerQ
                hasLabel
                value={equalizerQ}
                eq={id}
                group={group}
                channelId={channelId}
              />
            )}
            {equalizerType !== 'Bandpass' && (
              <pc.EqualizerShelving
                hasLabel
                value={equalizerShelving}
                eq={id}
                group={group}
                channelId={channelId}
              />
            )}
          </Col>
        </Row>
        <pc.EqualizerGain
          hasLabel
          value={equalizerGain}
          eq={id}
          group={group}
          channelId={channelId}
        />
      </Card.Body>
    </Card>
  );
}

export default Equalizer;
