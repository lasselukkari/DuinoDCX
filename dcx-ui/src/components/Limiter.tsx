import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import {output, type OutputId} from '@/components/parameters/index.tsx';

type LimiterProps = {
  readonly channelName?: string;
  readonly isLimiterOn: boolean;
  readonly limiterThreshold: number;
  readonly limiterRelease: string;
  readonly channelId: string;
};

function Limiter({
  channelName,
  isLimiterOn,
  limiterThreshold,
  limiterRelease,
  channelId,
}: LimiterProps) {
  const id = channelId as OutputId;

  return (
    <Card>
      <Card.Header>
        {channelName ? `${channelId}. ${channelName}` : `Channel ${channelId}`}
      </Card.Header>
      <Card.Body>
        <Row>
          <Col xs={6} md={12} lg={6}>
            <output.IsLimiterOn value={isLimiterOn} label="Limiter" id={id} />
          </Col>
          <Col xs={6} md={12} lg={6}>
            <output.LimiterRelease hasLabel value={limiterRelease} id={id} />
          </Col>
        </Row>
        <output.LimiterThreshold hasLabel value={limiterThreshold} id={id} />
      </Card.Body>
    </Card>
  );
}

export default Limiter;
