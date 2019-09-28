import React, {Component} from 'react';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import Delay from './Delay';
import pc from './parameters';

class Delays extends Component {
  static propTypes = {
    group: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    channels: PropTypes.objectOf(
      PropTypes.shape({
        delay: PropTypes.bool.isRequired,
        longDelay: PropTypes.number.isRequired,
        shortDelay: PropTypes.number,
        channelName: PropTypes.string
      })
    ).isRequired,
    setup: PropTypes.shape({
      airTemperature: PropTypes.number.isRequired,
      delayCorrection: PropTypes.bool.isRequired,
      delayUnits: PropTypes.string.isRequired,
      delayLink: PropTypes.bool.isRequired
    }).isRequired
  };

  shouldComponentUpdate(nextProps) {
    const {channels, setup} = this.props;

    return !(
      isEqual(channels, nextProps.channels) &&
      setup.airTemperature === nextProps.setup.airTemperature &&
      setup.delayLink === nextProps.setup.delayLink &&
      setup.delayCorrection === nextProps.setup.delayCorrection &&
      setup.delayUnits === nextProps.setup.delayUnits
    );
  }

  render() {
    const {channels, setup, group, onChange} = this.props;
    const {airTemperature, delayCorrection, delayLink, delayUnits} = setup;

    return (
      <div>
        {group === 'outputs' && (
          <Card>
            <Card.Header>Long Delay Link</Card.Header>
            <Card.Body>
              <pc.DelayLink value={delayLink} onChange={onChange} />
            </Card.Body>
          </Card>
        )}

        {Object.keys(channels).map(channelId => {
          const channel = channels[channelId];
          return (
            <Delay
              key={channelId}
              channel
              group={group}
              channelId={channelId}
              delay={channel.delay}
              delayUnits={delayUnits}
              shortDelay={channel.shortDelay}
              longDelay={channel.longDelay}
              airTemperature={airTemperature}
              delayCorrection={delayCorrection}
              channelName={channel.channelName}
              onChange={onChange}
            />
          );
        })}
      </div>
    );
  }
}

export default Delays;
