import React, {PureComponent} from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import pc, {type ChangeEventArgs} from './parameters/index.tsx';

type LimiterProps = {
  readonly channelName?: string | undefined;
  readonly isLimiterOn: boolean;
  readonly limiterThreshold: number | string;
  readonly limiterRelease: number | string;
  readonly channelId: number | string;
  readonly onChange: (args: ChangeEventArgs) => void;
  readonly group: string;
};

class Limiter extends PureComponent<LimiterProps> {
  static defaultProps = {
    channelName: undefined,
  };

  render() {
    const {
      channelName,
      isLimiterOn,
      limiterThreshold,
      limiterRelease,
      channelId,
      onChange,
      group,
    } = this.props;

    return (
      <Card>
        <Card.Header>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col xs={6} md={12} lg={6}>
              <pc.IsLimiterOn
                isTrue={isLimiterOn}
                label="Limiter"
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col xs={6} md={12} lg={6}>
              <pc.LimiterRelease
                hasLabel
                value={limiterRelease}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
          </Row>
          <pc.LimiterThreshold
            hasLabel
            value={limiterThreshold}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
        </Card.Body>
      </Card>
    );
  }
}

export default Limiter;
