import React, {Component} from 'react';
import {Panel} from 'react-bootstrap';
import isEqual from 'lodash.isequal';
import pc from './parameters';

import Delay from './Delay';

class Delays extends Component {
  shouldComponentUpdate(nextProps) {
    const {channels, setup} = this.props;

    return !(
      isEqual(channels, nextProps.channels) &&
      setup.airTemperature === nextProps.setup.airTemperature &&
      setup.delayLink === nextProps.setup.delayLink &&
      setup.delayCorrection === nextProps.setup.delayCorrection &&
      setup.delayUnits === nextProps.setup.delayUnits
    );
  }

  render() {
    const {channels, setup, group, onChange} = this.props;
    const {airTemperature, delayCorrection, delayLink, delayUnits} = setup;

    return (
      <div>
        {group === 'outputs' && (
          <Panel>
            <Panel.Heading>Long Delay Link</Panel.Heading>
            <Panel.Body>
              <pc.DelayLink value={delayLink} onChange={onChange} />
            </Panel.Body>
          </Panel>
        )}

        {Object.keys(channels).map(channelId => {
          const channel = channels[channelId];
          return (
            <Delay
              key={channelId}
              channel
              group={group}
              channelId={channelId}
              delay={channel.delay}
              delayUnits={delayUnits}
              shortDelay={channel.shortDelay}
              longDelay={channel.longDelay}
              airTemperature={airTemperature}
              delayCorrection={delayCorrection}
              channelName={channel.channelName}
              onChange={onChange}
            />
          );
        })}
      </div>
    );
  }
}

export default Delays;
