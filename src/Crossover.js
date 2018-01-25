import React, {PureComponent} from 'react';
import {Panel} from 'react-bootstrap';

import pc from './parameters';

class Crossover extends PureComponent {
  render() {
    const {highpassFilter,
      highpassFrequency,
      lowpassFilter,
      lowpassFrequency,
      channelName,
      group,
      channelId,
      onChange} = this.props;

    return (
      <Panel header={channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}>
        <pc.HighpassFilter
          value={highpassFilter}
          group={group}
          channelId={channelId}
          onChange={onChange}
          includeLabel
        />
        <pc.HighpassFrequency
          value={highpassFrequency}
          group={group}
          channelId={channelId}
          onChange={onChange}
          includeLabel
        />
        <pc.LowpassFilter
          value={lowpassFilter}
          group={group}
          channelId={channelId}
          onChange={onChange}
          includeLabel
        />
        <pc.LowpassFrequency
          value={lowpassFrequency}
          group={group}
          channelId={channelId}
          onChange={onChange}
          includeLabel
        />
      </Panel>
    );
  }
}

export default Crossover;
