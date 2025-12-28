import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import pc from './parameters/index.tsx';

type EqualizerProps = {
  readonly eQType: string;
  readonly eQFrequency: number | string;
  readonly eQQ: number | string;
  readonly eQShelving: string;
  readonly eQGain: number | string;
  readonly id: string;
  readonly group: string;
  readonly channelId: string;
};

function Equalizer({
  eQType,
  eQFrequency,
  eQQ,
  eQShelving,
  eQGain,
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
            <pc.EQType
              hasLabel
              value={eQType}
              eq={id}
              group={group}
              channelId={channelId}
            />
          </Col>
          <Col xs={12} sm={4}>
            <pc.EQFrequency
              hasLabel
              value={eQFrequency}
              eq={id}
              group={group}
              channelId={channelId}
            />
          </Col>
          <Col xs={12} sm={4}>
            {eQType === 'Bandpass' && (
              <pc.EQQ
                hasLabel
                value={eQQ}
                eq={id}
                group={group}
                channelId={channelId}
              />
            )}
            {eQType !== 'Bandpass' && (
              <pc.EQShelving
                hasLabel
                value={eQShelving}
                eq={id}
                group={group}
                channelId={channelId}
              />
            )}
          </Col>
        </Row>
        <pc.EQGain
          hasLabel
          value={eQGain}
          eq={id}
          group={group}
          channelId={channelId}
        />
      </Card.Body>
    </Card>
  );
}

export default Equalizer;
