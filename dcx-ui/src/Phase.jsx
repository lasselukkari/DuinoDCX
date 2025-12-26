import React, {PureComponent} from 'react';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import pc from './parameters';

class Phase extends PureComponent {
  static propTypes = {
    channelId: PropTypes.string.isRequired,
    channelName: PropTypes.string.isRequired,
    polarity: PropTypes.string.isRequired,
    phase: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    group: PropTypes.string.isRequired
  };

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
            hasLabel
            value={polarity}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
          <pc.Phase
            hasLabel
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
