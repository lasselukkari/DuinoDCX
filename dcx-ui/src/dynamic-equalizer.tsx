import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import pc from './parameters/index.tsx';

type DynamicEqualizerProps = {
  readonly channelName?: string;
  readonly isDynamicEqualizerOn: boolean;
  readonly dynamicEqualizerType: string;
  readonly dynamicEqualizerFrequency: number | string;
  readonly dynamicEqualizerGain: number | string;
  readonly dynamicEqualizerQ: number | string;
  readonly dynamicEqualizerShelving: string;
  readonly dynamicEqualizerAttack: number | string;
  readonly dynamicEqualizerRelease: number | string;
  readonly dynamicEqualizerRatio: number | string;
  readonly dynamicEqualizerThreshold: number | string;
  readonly group: string;
  readonly channelId: string;
};

function DynamicEqualizer({
  channelName,
  isDynamicEqualizerOn,
  dynamicEqualizerType,
  dynamicEqualizerFrequency,
  dynamicEqualizerGain,
  dynamicEqualizerQ,
  dynamicEqualizerShelving,
  dynamicEqualizerAttack,
  dynamicEqualizerRelease,
  dynamicEqualizerRatio,
  dynamicEqualizerThreshold,
  group,
  channelId,
}: DynamicEqualizerProps) {
  return (
    <Card>
      <Card.Header>
        {channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}
      </Card.Header>
      <Card.Body>
        <pc.IsDynamicEqualizerOn
          value={isDynamicEqualizerOn}
          group={group}
          channelId={channelId}
        />
        <Row>
          <Col md={12} lg={6}>
            <pc.DynamicEqualizerType
              hasLabel
              value={dynamicEqualizerType}
              group={group}
              channelId={channelId}
            />
          </Col>
          <Col md={12} lg={6}>
            <pc.DynamicEqualizerFrequency
              hasLabel
              value={dynamicEqualizerFrequency}
              group={group}
              channelId={channelId}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12} lg={6}>
            {dynamicEqualizerType === 'Bandpass' && (
              <pc.DynamicEqualizerQ
                hasLabel
                value={dynamicEqualizerQ}
                group={group}
                channelId={channelId}
              />
            )}
            {dynamicEqualizerType !== 'Bandpass' && (
              <pc.DynamicEqualizerShelving
                hasLabel
                value={dynamicEqualizerShelving}
                group={group}
                channelId={channelId}
              />
            )}
          </Col>
          <Col md={12} lg={6}>
            <pc.DynamicEqualizerAttack
              hasLabel
              value={dynamicEqualizerAttack}
              group={group}
              channelId={channelId}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12} lg={6}>
            <pc.DynamicEqualizerRelease
              hasLabel
              value={dynamicEqualizerRelease}
              group={group}
              channelId={channelId}
            />
          </Col>
          <Col md={12} lg={6}>
            <pc.DynamicEqualizerRatio
              hasLabel
              value={dynamicEqualizerRatio}
              group={group}
              channelId={channelId}
            />
          </Col>
        </Row>
        <pc.DynamicEqualizerGain
          hasLabel
          value={dynamicEqualizerGain}
          group={group}
          channelId={channelId}
        />
        <pc.DynamicEqualizerThreshold
          hasLabel
          value={dynamicEqualizerThreshold}
          group={group}
          channelId={channelId}
        />
      </Card.Body>
    </Card>
  );
}

export default DynamicEqualizer;
