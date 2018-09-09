import React, {PureComponent} from 'react';
import {Panel} from 'react-bootstrap';
import pc from './parameters';

class Delay extends PureComponent {
  render() {
    const {
      delay,
      shortDelay,
      longDelay,
      channelName,
      channelId,
      airTemperature,
      delayCorrection,
      onChange,
      group
    } = this.props;
    const temperature = delayCorrection ? airTemperature : 20;

    // https://en.wikipedia.org/wiki/Speed_of_sound#Practical_formula_for_dry_air
    const multiplier = 1 / (331.3 + 0.606 * temperature);

    const round = value => Math.round(value * 100) / 100;
    const formatter = (value, unit) =>
      `${round(value)} ${unit} / ${round(
        multiplier * value * (unit === 'cm' ? 10 : 1)
      )} ms`;

    return (
      <Panel>
        <Panel.Heading>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Panel.Heading>
        <Panel.Body>
          <pc.Delay
            value={delay}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
          {group === 'outputs' && (
            <pc.ShortDelay
              includeLabel
              value={shortDelay}
              group={group}
              channelId={channelId}
              formatter={formatter}
              onChange={onChange}
            />
          )}
          <pc.LongDelay
            includeLabel
            value={longDelay}
            group={group}
            channelId={channelId}
            formatter={formatter}
            onChange={onChange}
          />
        </Panel.Body>
      </Panel>
    );
  }
}

export default Delay;
