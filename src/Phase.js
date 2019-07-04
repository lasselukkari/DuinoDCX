import React, {PureComponent} from 'react';
import {Card} from 'react-bootstrap';

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
      <Card>
        <Card.Header>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Card.Header>
        <Card.Body>
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
        </Card.Body>
      </Card>
    );
  }
}

export default Phase;
