import React, {PureComponent} from 'react';

import pc from './parameters';

class ChannelName extends PureComponent {
  render() {
    const {channelName, channelId, onChange, group} = this.props;

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
