import React, {Component} from 'react';
import Col from 'react-bootstrap/Col';
import PropTypes from 'prop-types';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import Limiter from './Limiter';

class Limiters extends Component {
  static propTypes = {
    channels: PropTypes.object.isRequired,
    group: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
  };

  shouldComponentUpdate(nextProps) {
    const {channels} = this.props;
    return !isEqual(channels, nextProps.channels);
  }

  render() {
    const {channels, onChange, group} = this.props;

    return (
      <Row className="show-grid">
        {Object.keys(channels).map((channelId) => {
          const {
            channelName,
            isLimiterOn,
            limiterThreshold,
            limiterRelease
          } = channels[channelId];
          return (
            <Col key={channelId} xs={12} sm={12} md={6}>
              <Limiter
                key={channelId}
                channel={channels[channelId]}
                channelId={channelId}
                group={group}
                channelName={channelName}
                isLimiterOn={isLimiterOn}
                limiterThreshold={limiterThreshold}
                limiterRelease={limiterRelease}
                onChange={onChange}
              />
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default Limiters;
