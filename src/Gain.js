import React, {Component} from 'react';
import isEqual from 'lodash.isequal';
import pc from './parameters';

class Gain extends Component {
  shouldComponentUpdate(nextProps) {
    const {channel} = this.props;
    return !isEqual(channel, nextProps.channel);
  }

  render() {
    const {channel, group, channelId, onChange} = this.props;
    const {channelName, gain} = channel;

    return (
      <div>
        <h4>
          {channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}
        </h4>
        <pc.Gain
          value={gain}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
      </div>
    );
  }
}

export default Gain;
