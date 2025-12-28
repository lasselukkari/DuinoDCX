import React from 'react';
import Parser from '../dcx2496/parser.ts';
import { type Command } from '../dcx2496/commands.tsx';
import BoolParameter from './bool-parameter.tsx';
import EnumParameter from './enum-parameter.tsx';
import NumberParameter from './number-parameter.tsx';

export type ParameterComponentProps = {
  readonly value: boolean | number | string;
  readonly group?: string;
  readonly channelId?: string;
  readonly eq?: string;
  readonly hasLabel?: boolean;
  readonly isInverted?: boolean;
  readonly label?: string;
  readonly formatter?: (value: number, unit?: string) => string;
  readonly labelFormatter?: (value: number, unit?: string) => string;
};

const components: Record<string, React.FC<ParameterComponentProps>> = {};

const commandTypes = {
  setupCommand: 0,
  eqCommand: 1,
  ioCommand: 2,
  outputCommand: 3,
};

export type ChangeEventArgs = {
  param: string;
  group?: string;
  channelId?: string;
  eq?: string;
  value: boolean | number | string;
};

type ComponentProps = ParameterComponentProps;

type EnumComponentProps = ComponentProps & {};

const enumComponent = function (command: Command) {
  const { name, values, unit } = command;
  function EnumComponent({
    value,
    group = 'inputs',
    channelId = '0',
    eq,
    hasLabel = false,
  }: EnumComponentProps) {
    return (
      <EnumParameter
        name={name}
        unit={unit}
        value={value as string}
        param={Parser.camelize(name)}
        group={group}
        channelId={channelId}
        eq={eq}
        enums={values ? [...values] : []}
        hasLabel={hasLabel}
      />
    );
  }

  return EnumComponent;
};

const boolComponent = function (command: Command) {
  const { name } = command;
  function BoolComponent({
    value,
    group,
    channelId,
    eq,
    isInverted = false,
    hasLabel = false,
    label,
  }: ComponentProps & {
    readonly isInverted?: boolean;
    readonly label?: string;
  }) {
    return (
      <BoolParameter
        name={name}
        isTrue={Boolean(value)}
        param={Parser.camelize(name)}
        group={group}
        channelId={channelId}
        eq={eq}
        isInverted={isInverted}
        hasLabel={hasLabel}
        label={label}
      />
    );
  }

  return BoolComponent;
};

const numberComponent = function (command: Command) {
  const { name, unit, min, max, step } = command;
  function NumberComponent({
    value,
    group,
    channelId,
    eq,
    formatter,
    hasLabel = false,
    labelFormatter,
  }: ComponentProps & {
    readonly formatter?: (value: number, unit?: string) => string;
    readonly labelFormatter?: (value: number, unit?: string) => string;
  }) {
    return (
      <NumberParameter
        name={name}
        unit={unit ?? ''}
        value={value as number}
        param={Parser.camelize(name)}
        group={group}
        channelId={channelId}
        min={min ?? 0}
        max={max ?? 100}
        step={step ?? 1}
        eq={eq}
        hasLabel={hasLabel}
        formatter={formatter}
        labelFormatter={labelFormatter}
      />
    );
  }

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

// eslint-disable-next-line unicorn/prefer-string-replace-all
const squeeze = (word: string) => word.replace(/\s/g, '');

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
  DynamicEQAttack: components.DynamicEQAttack,
  DynamicEQRelease: components.DynamicEQRelease,
  DynamicEQRatio: components.DynamicEQRatio,
  DynamicEQThreshold: components.DynamicEQThreshold,
  IsDynamicEQOn: components.IsDynamicEQOn,
  DynamicEQFrequency: components.DynamicEQFrequency,
  DynamicEQQ: components.DynamicEQQ,
  DynamicEQGain: components.DynamicEQGain,
  DynamicEQType: components.DynamicEQType,
  DynamicEQShelving: components.DynamicEQShelving,

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
