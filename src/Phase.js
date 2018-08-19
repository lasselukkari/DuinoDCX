import React, {PureComponent} from 'react';
import {Panel} from 'react-bootstrap';

import pc from './parameters';

class Phase extends PureComponent {
  render() {
    const {
      channelName,
      polarity,
      phase,
      channelId,
      onChange,
      group
    } = this.props;

    return (
      <Panel
        header={
          channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`
        }
      >
        <pc.Polarity
          includeLabel
          value={polarity}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
        <pc.Phase
          includeLabel
          value={phase}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
      </Panel>
    );
  }
}

export default Phase;
