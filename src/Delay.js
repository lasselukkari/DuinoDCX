import React, {PureComponent} from 'react';
import {Panel} from 'react-bootstrap';
import pc from './parameters';

class Delay extends PureComponent {
  render() {
    const {delay, shortDelay, longDelay, channelName, channelId, onChange, group} = this.props;

    return (
      <Panel header={channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}>
        <pc.Delay
          value={delay}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
        {group === 'outputs' && (
          <pc.ShortDelay
            value={shortDelay}
            group={group}
            channelId={channelId}
            onChange={onChange}
            includeLabel
          />
        )}
        <pc.LongDelay
          value={longDelay}
          group={group}
          channelId={channelId}
          onChange={onChange}
          includeLabel
        />
      </Panel>
    );
  }
}

export default Delay;
