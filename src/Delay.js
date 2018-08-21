import React, {PureComponent} from 'react';
import {Panel} from 'react-bootstrap';
import pc from './parameters';

class Delay extends PureComponent {
  render() {
    const {
      delay,
      shortDelay,
      longDelay,
      channelName,
      channelId,
      onChange,
      group
    } = this.props;

    return (
      <Panel>
        <Panel.Heading>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Panel.Heading>
        <Panel.Body>
          <pc.Delay
            value={delay}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
          {group === 'outputs' && (
            <pc.ShortDelay
              includeLabel
              value={shortDelay}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          )}
          <pc.LongDelay
            includeLabel
            value={longDelay}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
        </Panel.Body>
      </Panel>
    );
  }
}

export default Delay;
