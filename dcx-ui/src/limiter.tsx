import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import pc from './parameters/index.tsx';

type LimiterProps = {
  readonly channelName?: string;
  readonly isLimiterOn: boolean;
  readonly limiterThreshold: number | string;
  readonly limiterRelease: number | string;
  readonly channelId: string;
  readonly group: string;
};

function Limiter({
  channelName,
  isLimiterOn,
  limiterThreshold,
  limiterRelease,
  channelId,
  group,
}: LimiterProps) {
  return (
    <Card>
      <Card.Header>
        {channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}
      </Card.Header>
      <Card.Body>
        <Row>
          <Col xs={6} md={12} lg={6}>
            <pc.IsLimiterOn
              value={isLimiterOn}
              label="Limiter"
              group={group}
              channelId={channelId}
            />
          </Col>
          <Col xs={6} md={12} lg={6}>
            <pc.LimiterRelease
              hasLabel
              value={limiterRelease}
              group={group}
              channelId={channelId}
            />
          </Col>
        </Row>
        <pc.LimiterThreshold
          hasLabel
          value={limiterThreshold}
          group={group}
          channelId={channelId}
        />
      </Card.Body>
    </Card>
  );
}

export default Limiter;
