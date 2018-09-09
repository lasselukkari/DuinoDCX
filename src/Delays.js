import React, {Component} from 'react';
import {Row, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import Delay from './Delay';

class Delays extends Component {
  shouldComponentUpdate(nextProps) {
    const {channels, setup} = this.props;

    return !(
      isEqual(channels, nextProps.channels) &&
      setup.airTemperature === nextProps.setup.airTemperature &&
      setup.delayCorrection === nextProps.setup.delayCorrection
    );
  }

  render() {
    const {channels, setup, group, onChange, xs, sm, md, lg} = this.props;
    const {airTemperature, delayCorrection} = setup;

    return (
      <Row className="show-grid">
        {Object.keys(channels).map(channelId => {
          const channel = channels[channelId];
          return (
            <Col key={channelId} xs={xs} sm={sm} md={md} lg={lg}>
              <Delay
                key={channelId}
                channel
                group={group}
                channelId={channelId}
                delay={channel.delay}
                shortDelay={channel.shortDelay}
                longDelay={channel.longDelay}
                airTemperature={airTemperature}
                delayCorrection={delayCorrection}
                channelName={channel.channelName}
                onChange={onChange}
              />
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default Delays;
