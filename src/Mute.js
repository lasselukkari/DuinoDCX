import React, {Component} from 'react';
import isEqual from 'lodash.isequal';

import pc from './parameters';

class Mute extends Component {
  shouldComponentUpdate(nextProps) {
    const {channel} = this.props;
    return !isEqual(channel, nextProps.channel);
  }

  render() {
    const {channel, group, channelId, onChange} = this.props;
    const {mute} = channel;

    return (
      <pc.Mute
        value={mute}
        group={group}
        channelId={channelId}
        onChange={onChange}
        channelButton
        inverted
      />
    );
  }
}

export default Mute;
