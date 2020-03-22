import React, {PureComponent} from 'react';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import pc from './parameters';

class Delay extends PureComponent {
  static defaultProps = {
    channelName: null,
    shortDelay: null
  };

  static propTypes = {
    channelId: PropTypes.string.isRequired,
    channelName: PropTypes.string,
    group: PropTypes.string.isRequired,
    isDelayOn: PropTypes.bool.isRequired,
    longDelay: PropTypes.number.isRequired,
    shortDelay: PropTypes.number,
    airTemperature: PropTypes.number.isRequired,
    isDelayCorrectionOn: PropTypes.bool.isRequired,
    delayUnits: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
  };

  render() {
    const {
      isDelayOn,
      shortDelay,
      longDelay,
      channelName,
      channelId,
      airTemperature,
      isDelayCorrectionOn,
      delayUnits,
      onChange,
      group
    } = this.props;
    const temperature = isDelayCorrectionOn ? airTemperature : 20;
    // https://en.wikipedia.org/wiki/Speed_of_sound#Practical_formula_for_dry_air
    const temperatureFactor = 1 / (331.3 + 0.606 * temperature);
    const round = (value) => Math.round(value * 100) / 100;
    const localizeLength =
      delayUnits === 'mm'
        ? (value) => value
        : (value) => (value * 0.393701) / 10;

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
      <Card>
        <Card.Header>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Card.Header>
        <Card.Body>
          <pc.IsDelayOn
            isTrue={isDelayOn}
            group={group}
            channelId={channelId}
            labelFormatter={labelFormatter}
            onChange={onChange}
          />
          {group === 'outputs' && (
            <pc.ShortDelay
              hasLabel
              value={shortDelay}
              group={group}
              channelId={channelId}
              formatter={formatter}
              labelFormatter={labelFormatter}
              onChange={onChange}
            />
          )}
          <pc.LongDelay
            hasLabel
            value={longDelay}
            group={group}
            channelId={channelId}
            formatter={formatter}
            labelFormatter={labelFormatter}
            onChange={onChange}
          />
        </Card.Body>
      </Card>
    );
  }
}

export default Delay;
