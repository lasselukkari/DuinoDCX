import React, {Component} from 'react';
import {Panel} from 'react-bootstrap';
import isEqual from 'lodash.isequal';
import pc from './parameters';

class Delay extends Component {
  shouldComponentUpdate(nextProps) {
    const {channel} = this.props;
    return !isEqual(channel, nextProps.channel);
  }

  render() {
    const {channel, channelId, onChange, group} = this.props;
    const {delay, shortDelay, longDelay, channelName} = channel;

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
