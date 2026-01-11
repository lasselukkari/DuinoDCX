import Card from 'react-bootstrap/Card';
import {
  input,
  output,
  type InputId,
  type OutputId,
} from '@/components/parameters/index.tsx';

type DelayProps = {
  readonly isDelayOn: boolean;
  readonly shortDelay: number;
  readonly longDelay: number;
  readonly channelName?: string;
  readonly channelId: string;
  readonly airTemperature: number;
  readonly isDelayCorrectionOn: boolean;
  readonly delayUnits: string; // 'mm', 'inch', etc
  readonly group: 'inputs' | 'outputs';
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

  const formatter = (value: number, unit?: string) =>
    `${round(
      localizeLength(value) / localizeDividor(delayUnits, unit ?? ''),
    )} ${localizeUnit(delayUnits, unit ?? '')} / ${round(
      temperatureFactor * value * (unit === 'cm' ? 10 : 1),
    )} ms`;

  const labelFormatter = (value: number, unit?: string) =>
    round(
      localizeLength(value) / localizeDividor(delayUnits, unit ?? ''),
    ).toString();

  if (group === 'outputs') {
    const id = channelId as OutputId;
    return (
      <Card>
        <Card.Header>
          {channelName
            ? `${channelId}. ${channelName}`
            : `Channel ${channelId}`}
        </Card.Header>
        <Card.Body>
          <output.IsDelayOn value={isDelayOn} id={id} />
          <output.ShortDelay
            hasLabel
            value={shortDelay}
            id={id}
            formatter={formatter}
            labelFormatter={labelFormatter}
          />
          <output.LongDelay
            hasLabel
            value={longDelay}
            id={id}
            formatter={formatter}
            labelFormatter={labelFormatter}
          />
        </Card.Body>
      </Card>
    );
  }

  // Inputs
  const id = channelId as InputId;
  return (
    <Card>
      <Card.Header>
        {channelName ? `${channelId}. ${channelName}` : `Channel ${channelId}`}
      </Card.Header>
      <Card.Body>
        <input.IsDelayOn value={isDelayOn} id={id} />
        <input.LongDelay
          hasLabel
          value={longDelay}
          id={id}
          formatter={formatter}
          labelFormatter={labelFormatter}
        />
      </Card.Body>
    </Card>
  );
}

export default Delay;
