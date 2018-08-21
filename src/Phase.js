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
      <Panel>
        <Panel.Heading>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Panel.Heading>
        <Panel.Body>
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
        </Panel.Body>
      </Panel>
    );
  }
}

export default Phase;
