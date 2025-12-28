import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import pc from './parameters/index.tsx';

type DynamicEqualizerProps = {
  readonly channelName?: string;
  readonly isDynamicEQOn: boolean;
  readonly dynamicEQType: string;
  readonly dynamicEQFrequency: number | string;
  readonly dynamicEQGain: number | string;
  readonly dynamicEQQ: number | string;
  readonly dynamicEQShelving: string;
  readonly dynamicEQAttack: number | string;
  readonly dynamicEQRelease: number | string;
  readonly dynamicEQRatio: number | string;
  readonly dynamicEQThreshold: number | string;
  readonly group: string;
  readonly channelId: string;
};

function DynamicEqualizer({
  channelName,
  isDynamicEQOn,
  dynamicEQType,
  dynamicEQFrequency,
  dynamicEQGain,
  dynamicEQQ,
  dynamicEQShelving,
  dynamicEQAttack,
  dynamicEQRelease,
  dynamicEQRatio,
  dynamicEQThreshold,
  group,
  channelId,
}: DynamicEqualizerProps) {
  return (
    <Card>
      <Card.Header>
        {channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}
      </Card.Header>
      <Card.Body>
        <pc.IsDynamicEQOn
          value={isDynamicEQOn}
          group={group}
          channelId={channelId}
        />
        <Row>
          <Col md={12} lg={6}>
            <pc.DynamicEQType
              hasLabel
              value={dynamicEQType}
              group={group}
              channelId={channelId}
            />
          </Col>
          <Col md={12} lg={6}>
            <pc.DynamicEQFrequency
              hasLabel
              value={dynamicEQFrequency}
              group={group}
              channelId={channelId}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12} lg={6}>
            {dynamicEQType === 'Bandpass' && (
              <pc.DynamicEQQ
                hasLabel
                value={dynamicEQQ}
                group={group}
                channelId={channelId}
              />
            )}
            {dynamicEQType !== 'Bandpass' && (
              <pc.DynamicEQShelving
                hasLabel
                value={dynamicEQShelving}
                group={group}
                channelId={channelId}
              />
            )}
          </Col>
          <Col md={12} lg={6}>
            <pc.DynamicEQAttack
              hasLabel
              value={dynamicEQAttack}
              group={group}
              channelId={channelId}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12} lg={6}>
            <pc.DynamicEQRelease
              hasLabel
              value={dynamicEQRelease}
              group={group}
              channelId={channelId}
            />
          </Col>
          <Col md={12} lg={6}>
            <pc.DynamicEQRatio
              hasLabel
              value={dynamicEQRatio}
              group={group}
              channelId={channelId}
            />
          </Col>
        </Row>
        <pc.DynamicEQGain
          hasLabel
          value={dynamicEQGain}
          group={group}
          channelId={channelId}
        />
        <pc.DynamicEQThreshold
          hasLabel
          value={dynamicEQThreshold}
          group={group}
          channelId={channelId}
        />
      </Card.Body>
    </Card>
  );
}

export default DynamicEqualizer;
