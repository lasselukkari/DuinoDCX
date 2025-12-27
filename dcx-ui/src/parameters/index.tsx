import React from 'react';
import Parser from '../dcx2496/parser.tsx';
import {type Command} from '../dcx2496/commands.tsx';
import BoolParameter from './bool-parameter.tsx';
import EnumParameter from './enum-parameter.tsx';
import NumberParameter from './number-parameter.tsx';

const components: Record<string, React.FC<unknown>> = {};

const commandTypes = {
  SETUP_COMMAND: 0,
  EQ_COMMAND: 1,
  IO_COMMAND: 2,
  OUTPUT_COMMAND: 3,
};

type ChangeEventArgs = {
  param: string;
  group?: string;
  channelId?: string;
  eq?: string;
  value: boolean | number | string;
};

type ComponentProps = {
  readonly value: boolean | number | string;
  readonly group?: string;
  readonly channelId?: string;
  readonly eq?: string;
  readonly onChange: (args: ChangeEventArgs) => void;
  readonly hasLabel?: boolean;
};

const enumComponent = function (command: Command) {
  const {name, values, unit} = command;
  const EnumComponent: React.FC<ComponentProps> = ({
    value,
    group,
    channelId,
    eq,
    onChange,
    hasLabel,
  }) => {
    return (
      <EnumParameter
        name={name}
        unit={unit}
        value={value}
        param={Parser.camelize(name)}
        group={group}
        channelId={channelId}
        eq={eq}
        enums={values ? [...values] : []}
        hasLabel={hasLabel}
        onChange={onChange}
      />
    );
  };

  return EnumComponent;
};

const boolComponent = function (command: Command) {
  const {name} = command;
  const BoolComponent: React.FC<{
    readonly isTrue: boolean;
    readonly group?: string;
    readonly channelId?: string;
    readonly eq?: string;
    readonly isInverted?: boolean;
    readonly onChange: (args: ChangeEventArgs) => void;
    readonly hasLabel?: boolean;
    readonly label?: string;
  }> = ({
    isTrue,
    group,
    channelId,
    eq,
    isInverted,
    onChange,
    hasLabel,
    label,
  }) => {
    return (
      <BoolParameter
        name={name}
        isTrue={isTrue}
        param={Parser.camelize(name)}
        group={group}
        channelId={channelId}
        eq={eq}
        isInverted={isInverted}
        hasLabel={hasLabel}
        label={label}
        onChange={onChange}
      />
    );
  };

  return BoolComponent;
};

const numberComponent = function (command: Command) {
  const {name, unit, min, max, step} = command;
  const NumberComponent: React.FC<
    ComponentProps & {
      readonly formatter?: (value: number, unit?: string) => string;
      readonly labelFormatter?: (value: number, unit?: string) => string;
    }
  > = ({
    value,
    group,
    channelId,
    eq,
    onChange,
    formatter,
    hasLabel,
    labelFormatter,
  }) => {
    return (
      <NumberParameter
        name={name}
        unit={unit || ''}
        value={value}
        param={Parser.camelize(name)}
        group={group}
        channelId={channelId}
        min={min || 0}
        max={max || 100}
        step={step || 1}
        eq={eq}
        hasLabel={hasLabel}
        formatter={formatter}
        labelFormatter={labelFormatter}
        onChange={onChange}
      />
    );
  };

  return NumberComponent;
};

const createComponent = (command: Command) => {
  if (command.type === 'enum') {
    return enumComponent(command);
  }

  if (command.type === 'bool') {
    return boolComponent(command);
  }

  if (command.type === 'number') {
    return numberComponent(command);
  }

  return (_props: unknown) => null;
};

const squeeze = (word: string) => word.replaceAll(/\s/g, '');

for (const command of Parser.commands.setupCommands) {
  components[squeeze(command.name)] = createComponent(command);
}

for (const command of Parser.commands.inputOutputCommands) {
  components[squeeze(command.name)] = createComponent(command);
}

for (const command of Parser.commands.eqCommands) {
  components[squeeze(command.name)] = createComponent(command);
}

for (const command of Parser.commands.outputCommands) {
  components[squeeze(command.name)] = createComponent(command);
}

const parameters = {
  // Setup components
  InputSumType: components.InputSumType,
  InputABSource: components.InputABSource,
  InputCGain: components.InputCGain,
  OutputConfig: components.OutputConfig,
  Stereolink: components.Stereolink,
  StereolinkMode: components.StereolinkMode,
  DelayLink: components.DelayLink,
  CrossoverLink: components.CrossoverLink,
  IsDelayCorrectionOn: components.IsDelayCorrectionOn,
  AirTemperature: components.AirTemperature,
  DelayUnits: components.DelayUnits,
  MuteOutsWhenPowered: components.MuteOutsWhenPowered,
  InputASumGain: components.InputASumGain,
  InputBSumGain: components.InputBSumGain,
  InputCSumGain: components.InputCSumGain,

  // Io components
  Gain: components.Gain,
  Mute: components.Mute,
  IsDelayOn: components.IsDelayOn,
  LongDelay: components.LongDelay,
  IsEQOn: components.IsEQOn,
  EQNumber: components.EQNumber,
  EQIndex: components.EQIndex,
  DynamiceqAttack: components.DynamiceqAttack,
  DynamiceqRelease: components.DynamiceqRelease,
  DynamiceqRatio: components.DynamiceqRatio,
  DynamiceqThreshold: components.DynamiceqThreshold,
  isDynamiceqOn: components.IsDynamiceqOn,
  DynamiceqFrequency: components.DynamiceqFrequency,
  DynamiceqQ: components.DynamiceqQ,
  DynamiceqGain: components.DynamiceqGain,
  DynamiceqType: components.DynamiceqType,
  DynamiceqShelving: components.DynamiceqShelving,

  // 9 for each io
  EQFrequency: components.EQFrequency,
  EQQ: components.EQQ,
  EQGain: components.EQGain,
  EQType: components.EQType,
  EQShelving: components.EQShelving,

  // Out components
  ChannelName: components.ChannelName,
  Source: components.Source,
  HighpassFilter: components.HighpassFilter,
  HighpassFrequency: components.HighpassFrequency,
  LowpassFilter: components.LowpassFilter,
  LowpassFrequency: components.LowpassFrequency,
  IsLimiterOn: components.IsLimiterOn,
  LimiterThreshold: components.LimiterThreshold,
  LimiterRelease: components.LimiterRelease,
  Polarity: components.Polarity,
  Phase: components.Phase,
  ShortDelay: components.ShortDelay,
  commandTypes,
};

export default parameters;
