import Card from 'react-bootstrap/Card';
import pc from './parameters/index.tsx';

type DelayProps = {
  readonly isDelayOn: boolean;
  readonly shortDelay: number | string;
  readonly longDelay: number | string;
  readonly channelName?: string;
  readonly channelId: string;
  readonly airTemperature: number;
  readonly isDelayCorrectionOn: boolean;
  readonly delayUnits: string; // 'mm', 'inch', etc
  readonly group: string;
};

function Delay({
  isDelayOn,
  shortDelay,
  longDelay,
  channelName,
  channelId,
  airTemperature,
  isDelayCorrectionOn,
  delayUnits,
  group,
}: DelayProps) {
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

  const localizeUnit = (delayUnits_: string, unit: string) => {
    if (delayUnits_ === 'mm') {
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

  const localizeDividor = (delayUnits_: string, unit: string) => {
    if (delayUnits_ === 'mm') {
      if (unit === 'mm') {
        return 1;
      }

      if (unit === 'cm') {
        return 100;
      }
    } else if (delayUnits_ === 'inch') {
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
    round(localizeLength(value) / localizeDividor(delayUnits, unit)).toString();

  return (
    <Card>
      <Card.Header>
        {channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}
      </Card.Header>
      <Card.Body>
        <pc.IsDelayOn
          value={isDelayOn}
          group={group}
          channelId={channelId}
          labelFormatter={labelFormatter}
        />
        {group === 'outputs' && (
          <pc.ShortDelay
            hasLabel
            value={shortDelay}
            group={group}
            channelId={channelId}
            formatter={formatter}
            labelFormatter={labelFormatter}
          />
        )}
        <pc.LongDelay
          hasLabel
          value={longDelay}
          group={group}
          channelId={channelId}
          formatter={formatter}
          labelFormatter={labelFormatter}
        />
      </Card.Body>
    </Card>
  );
}

export default Delay;
