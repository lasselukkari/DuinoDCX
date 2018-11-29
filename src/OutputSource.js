import React, {PureComponent} from 'react';

import pc from './parameters';

class OutputSource extends PureComponent {
  render() {
    const {channelName, source, channelId, onChange, group} = this.props;
    return (
      <div>
        <h5>{channelName ? channelId + '. ' + channelName : channelId}</h5>
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
