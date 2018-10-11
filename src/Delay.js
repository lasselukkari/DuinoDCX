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
      delayUnits,
      onChange,
      group
    } = this.props;
    const temperature = delayCorrection ? airTemperature : 20;
    // https://en.wikipedia.org/wiki/Speed_of_sound#Practical_formula_for_dry_air
    const temperatureFactor = 1 / (331.3 + 0.606 * temperature);
    const round = value => Math.round(value * 100) / 100;
    const localizeLength =
      delayUnits === 'mm' ? value => value : value => (value * 0.393701) / 10;

    const localizeUnit = (delayUnits, unit) => {
      if (delayUnits === 'mm') {
        if (unit === 'mm') {
          return 'mm';
        }
        return 'm';
      }
      if (unit === 'mm') {
        return 'in';
      }
      return 'ft';
    };

    const localizeDividor = (delayUnits, unit) => {
      if (delayUnits === 'mm') {
        if (unit === 'mm') {
          return 1;
        }
        if (unit === 'cm') {
          return 100;
        }
      } else if (delayUnits === 'inch') {
        if (unit === 'mm') {
          return 1;
        }
        if (unit === 'cm') {
          return 1.2;
        }
      }
    };

    const formatter = (value, unit) =>
      `${round(
        localizeLength(value) / localizeDividor(delayUnits, unit)
      )} ${localizeUnit(delayUnits, unit)} / ${round(
        temperatureFactor * value * (unit === 'cm' ? 10 : 1)
      )} ms`;

    const labelFormatter = (value, unit) =>
      round(
        localizeLength(value) / localizeDividor(delayUnits, unit)
      ).toString();

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
            labelFormatter={labelFormatter}
            onChange={onChange}
          />
          {group === 'outputs' && (
            <pc.ShortDelay
              includeLabel
              value={shortDelay}
              group={group}
              channelId={channelId}
              formatter={formatter}
              labelFormatter={labelFormatter}
              onChange={onChange}
            />
          )}
          <pc.LongDelay
            includeLabel
            value={longDelay}
            group={group}
            channelId={channelId}
            formatter={formatter}
            labelFormatter={labelFormatter}
            onChange={onChange}
          />
        </Panel.Body>
      </Panel>
    );
  }
}

export default Delay;
