import React, {PureComponent} from 'react';
import {Panel} from 'react-bootstrap';

import pc from './parameters';

class Crossover extends PureComponent {
  render() {
    const {
      highpassFilter,
      highpassFrequency,
      lowpassFilter,
      lowpassFrequency,
      channelName,
      group,
      channelId,
      onChange,
      gain
    } = this.props;

    return (
      <Panel>
        <Panel.Heading>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Panel.Heading>
        <Panel.Body>
          <pc.Gain
            includeLabel
            value={gain}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
          <pc.HighpassFilter
            includeLabel
            value={highpassFilter}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
          <pc.HighpassFrequency
            includeLabel
            value={highpassFrequency}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
          <pc.LowpassFilter
            includeLabel
            value={lowpassFilter}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
          <pc.LowpassFrequency
            includeLabel
            value={lowpassFrequency}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
        </Panel.Body>
      </Panel>
    );
  }
}

export default Crossover;
