import React, {PureComponent} from 'react';
import pc from './parameters';

class Gain extends PureComponent {
  render() {
    const {channelName, gain, group, channelId, onChange} = this.props;

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
