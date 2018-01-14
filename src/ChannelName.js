import React, {Component} from 'react';
import isEqual from 'lodash.isequal';

import pc from './parameters';

class ChannelName extends Component {
  shouldComponentUpdate(nextProps) {
    const {channel} = this.props;
    return !isEqual(channel, nextProps.channel);
  }

  render() {
    const {channel, channelId, onChange, group} = this.props;
    const {channelName} = channel;

    return (
      <div>
        <h5>
          {channelName ? channelId + '. ' + channelName : channelId}
        </h5>
        <pc.ChannelName
          value={channelName}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
      </div>
    );
  }
}

export default ChannelName;
