import React, {Component} from 'react';
import {Panel} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import pc from './parameters';

class Phase extends Component {
  shouldComponentUpdate(nextProps) {
    const {channel} = this.props;
    return !isEqual(channel, nextProps.channel);
  }

  render() {
    const {channel, channelId, onChange, group} = this.props;
    const {channelName, polarity, phase} = channel;

    return (
      <Panel header={channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}>
        <pc.Polarity
          value={polarity}
          group={group}
          channelId={channelId}
          onChange={onChange}
          includeLabel
        />
        <pc.Phase
          value={phase}
          group={group}
          channelId={channelId}
          onChange={onChange}
          includeLabel
        />
      </Panel>
    );
  }
}

export default Phase;
