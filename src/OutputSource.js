import React, {Component} from 'react';
import isEqual from 'lodash.isequal';

import pc from './parameters';

class OutputSource extends Component {
  shouldComponentUpdate(nextProps) {
    const {channel} = this.props;
    return !isEqual(channel, nextProps.channel);
  }
  render() {
    const {channel, channelId, onChange, group} = this.props;
    const {channelName, source} = channel;
    return (
      <div>
        <h5>
          {channelName ? channelId + '. ' + channelName : channelId}
        </h5>
        <pc.Source
          value={source}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
      </div>
    );
  }
}

export default OutputSource;
