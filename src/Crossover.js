import React, {Component} from 'react';
import {Panel} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import pc from './parameters';

class Crossover extends Component {
  shouldComponentUpdate(nextProps) {
    const {channel} = this.props;
    return !isEqual(channel, nextProps.channel);
  }
  render() {
    const {channel, group, channelId, onChange} = this.props;
    const {
      highpassFilter,
      highpassFrequency,
      lowpassFilter,
      lowpassFrequency,
      channelName
    } = channel;

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
