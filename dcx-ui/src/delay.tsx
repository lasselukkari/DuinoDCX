import React, {PureComponent} from 'react';
import Card from 'react-bootstrap/Card';
import pc, {type ChangeEventArgs} from './parameters/index.tsx';

type DelayProps = {
  readonly isDelayOn: boolean;
  readonly shortDelay: number | string;
  readonly longDelay: number | string;
  readonly channelName?: string | undefined;
  readonly channelId: number | string;
  readonly airTemperature: number;
  readonly isDelayCorrectionOn: boolean;
  readonly delayUnits: string; // 'mm', 'inch', etc
  readonly onChange: (args: ChangeEventArgs) => void;
  readonly group: string;
};

class Delay extends PureComponent<DelayProps> {
  static defaultProps = {
    channelName: undefined,
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
      group,
    } = this.props;
    const temperature = isDelayCorrectionOn ? airTemperature : 20;
    // https://en.wikipedia.org/wiki/Speed_of_sound#Practical_formula_for_dry_air
    const temperatureFactor = 1 / (331.3 + 0.606 * temperature);
    const round = (value: number) => Math.round(value * 100) / 100;

    const localizeLength = (value: number) => {
      if (delayUnits === 'mm') {
        return value;
      }

      return (value * 0.393_701) / 10;
    };

    const localizeUnit = (delayUnits: string, unit: string) => {
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

    const localizeDividor = (delayUnits: string, unit: string) => {
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

      return 1;
    };

    const formatter = (value: number, unit: string) =>
      `${round(
        localizeLength(value) / localizeDividor(delayUnits, unit),
      )} ${localizeUnit(delayUnits, unit)} / ${round(
        temperatureFactor * value * (unit === 'cm' ? 10 : 1),
      )} ms`;

    const labelFormatter = (value: number, unit: string) =>
      round(
        localizeLength(value) / localizeDividor(delayUnits, unit),
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
