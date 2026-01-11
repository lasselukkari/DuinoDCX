import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import {
  input,
  output,
  type InputId,
  type OutputId,
} from '@/components/parameters/index.tsx';

type DynamicEqualizerProps = {
  readonly channelName?: string;
  readonly isDynamicEqualizerOn: boolean;
  readonly dynamicEqualizerType: string;
  readonly dynamicEqualizerFrequency: string;
  readonly dynamicEqualizerGain: number;
  readonly dynamicEqualizerQ: string;
  readonly dynamicEqualizerShelving: string;
  readonly dynamicEqualizerAttack: string;
  readonly dynamicEqualizerRelease: string;
  readonly dynamicEqualizerRatio: string;
  readonly dynamicEqualizerThreshold: number;
  readonly group: 'inputs' | 'outputs';
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
        {channelName ? `${channelId}. ${channelName}` : `Channel ${channelId}`}
      </Card.Header>
      <Card.Body>
        {group === 'inputs' ? (
          <input.IsDynamicEqualizerOn
            value={isDynamicEqualizerOn}
            id={channelId as InputId}
          />
        ) : (
          <output.IsDynamicEqualizerOn
            value={isDynamicEqualizerOn}
            id={channelId as OutputId}
          />
        )}
        <Row>
          <Col md={12} lg={6}>
            {group === 'inputs' ? (
              <input.DynamicEqualizerType
                hasLabel
                value={dynamicEqualizerType}
                id={channelId as InputId}
              />
            ) : (
              <output.DynamicEqualizerType
                hasLabel
                value={dynamicEqualizerType}
                id={channelId as OutputId}
              />
            )}
          </Col>
          <Col md={12} lg={6}>
            {group === 'inputs' ? (
              <input.DynamicEqualizerFrequency
                hasLabel
                value={dynamicEqualizerFrequency}
                id={channelId as InputId}
              />
            ) : (
              <output.DynamicEqualizerFrequency
                hasLabel
                value={dynamicEqualizerFrequency}
                id={channelId as OutputId}
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col md={12} lg={6}>
            {dynamicEqualizerType === 'Bandpass' &&
              (group === 'inputs' ? (
                <input.DynamicEqualizerQ
                  hasLabel
                  value={dynamicEqualizerQ}
                  id={channelId as InputId}
                />
              ) : (
                <output.DynamicEqualizerQ
                  hasLabel
                  value={dynamicEqualizerQ}
                  id={channelId as OutputId}
                />
              ))}
            {dynamicEqualizerType !== 'Bandpass' &&
              (group === 'inputs' ? (
                <input.DynamicEqualizerShelving
                  hasLabel
                  value={dynamicEqualizerShelving}
                  id={channelId as InputId}
                />
              ) : (
                <output.DynamicEqualizerShelving
                  hasLabel
                  value={dynamicEqualizerShelving}
                  id={channelId as OutputId}
                />
              ))}
          </Col>
          <Col md={12} lg={6}>
            {group === 'inputs' ? (
              <input.DynamicEqualizerAttack
                hasLabel
                value={dynamicEqualizerAttack}
                id={channelId as InputId}
              />
            ) : (
              <output.DynamicEqualizerAttack
                hasLabel
                value={dynamicEqualizerAttack}
                id={channelId as OutputId}
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col md={12} lg={6}>
            {group === 'inputs' ? (
              <input.DynamicEqualizerRelease
                hasLabel
                value={dynamicEqualizerRelease}
                id={channelId as InputId}
              />
            ) : (
              <output.DynamicEqualizerRelease
                hasLabel
                value={dynamicEqualizerRelease}
                id={channelId as OutputId}
              />
            )}
          </Col>
          <Col md={12} lg={6}>
            {group === 'inputs' ? (
              <input.DynamicEqualizerRatio
                hasLabel
                value={dynamicEqualizerRatio}
                id={channelId as InputId}
              />
            ) : (
              <output.DynamicEqualizerRatio
                hasLabel
                value={dynamicEqualizerRatio}
                id={channelId as OutputId}
              />
            )}
          </Col>
        </Row>
        {group === 'inputs' ? (
          <input.DynamicEqualizerGain
            hasLabel
            value={dynamicEqualizerGain}
            id={channelId as InputId}
          />
        ) : (
          <output.DynamicEqualizerGain
            hasLabel
            value={dynamicEqualizerGain}
            id={channelId as OutputId}
          />
        )}
        {group === 'inputs' ? (
          <input.DynamicEqualizerThreshold
            hasLabel
            value={dynamicEqualizerThreshold}
            id={channelId as InputId}
          />
        ) : (
          <output.DynamicEqualizerThreshold
            hasLabel
            value={dynamicEqualizerThreshold}
            id={channelId as OutputId}
          />
        )}
      </Card.Body>
    </Card>
  );
}

export default DynamicEqualizer;
