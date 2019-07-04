import React, {PureComponent} from 'react';
import {FormLabel} from 'react-bootstrap';

import pc from './parameters';

class ChannelName extends PureComponent {
  render() {
    const {channelName, channelId, onChange, group} = this.props;

    return (
      <div>
        <FormLabel>
          {channelName ? channelId + '. ' + channelName : channelId}
        </FormLabel>
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
