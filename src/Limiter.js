import React, {PureComponent} from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import PropTypes from 'prop-types';
import Row from 'react-bootstrap/Row';
import pc from './parameters';

class Limiter extends PureComponent {
  static propTypes = {
    channelId: PropTypes.string.isRequired,
    group: PropTypes.string.isRequired,
    channelName: PropTypes.string.isRequired,
    isLimiterOn: PropTypes.bool.isRequired,
    limiterThreshold: PropTypes.number.isRequired,
    limiterRelease: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
  };

  render() {
    const {
      channelName,
      isLimiterOn,
      limiterThreshold,
      limiterRelease,
      channelId,
      onChange,
      group
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
