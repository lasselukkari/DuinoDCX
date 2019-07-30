import React, {PureComponent} from 'react';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
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

Phase.propTypes = {
  channelId: PropTypes.string.isRequired,
  channelName: PropTypes.string.isRequired,
  polarity: PropTypes.string.isRequired,
  phase: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  group: PropTypes.string.isRequired
};

export default Phase;
