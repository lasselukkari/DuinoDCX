/* eslint-disable react/prop-types, react/function-component-definition, func-names */
import React from 'react';
import {
  type Command,
  setupCommands,
  inputOutputCommands,
  equalizerCommands,
  outputCommands,
  camelize,
  type ParameterTarget,
} from 'dcx-parser';
import BoolParameter from './BoolParameter.js';
import EnumParameter from './EnumParameter.js';
import NumberParameter from './NumberParameter.js';

// =============================================================================
// Type Definitions
// =============================================================================

/** Valid input channel IDs */
export type InputId = 'A' | 'B' | 'C' | 'Sum';

/** Valid output channel IDs */
export type OutputId = '1' | '2' | '3' | '4' | '5' | '6';

/** Base props with generic value type */
type ValueProps<T> = {
  readonly value: T;
  readonly hasLabel?: boolean;
};

/** Props for setup parameters (no channel) */
export type SetupProps<T> = ValueProps<T>;

/** Props for input channel parameters */
export type InputProps<T> = ValueProps<T> & {
  readonly id: InputId;
};

/** Props for output channel parameters */
export type OutputProps<T> = ValueProps<T> & {
  readonly id: OutputId;
};

/** Props for equalizer band parameters */
export type EqProps<T> = ValueProps<T> & {
  readonly group: 'inputs' | 'outputs';
  readonly channelId: string;
  readonly band: number;
};

/** Extended props for number components */
type NumberExtraProps = {
  readonly formatter?: (value: number, unit?: string) => string;
  readonly labelFormatter?: (value: number, unit?: string) => string;
};

/** Extended props for bool components */
type BoolExtraProps = {
  readonly isInverted?: boolean;
  readonly label?: string;
};

// =============================================================================
// Target Builders
// =============================================================================

function buildSetupTarget(key: string): ParameterTarget {
  return {kind: 'setup', key};
}

function buildInputTarget(id: InputId, key: string): ParameterTarget {
  return {kind: 'channel', group: 'inputs', id, key};
}

function buildOutputTarget(id: OutputId, key: string): ParameterTarget {
  return {kind: 'channel', group: 'outputs', id, key};
}

function buildEqTarget(
  group: 'inputs' | 'outputs',
  channelId: string,
  band: number,
  key: string,
): ParameterTarget {
  return {kind: 'equalizer', group, channelId, band, key};
}

// =============================================================================
// Component Factories
// =============================================================================

function createSetupEnumComponent(
  command: Command,
): React.FC<SetupProps<string>> {
  const {name, values, unit} = command;
  const key = camelize(name);

  return function SetupEnumComponent({value, hasLabel = false}) {
    return (
      <EnumParameter
        name={name}
        unit={unit}
        value={value}
        target={buildSetupTarget(key)}
        enums={values ? [...values] : []}
        hasLabel={hasLabel}
      />
    );
  };
}

function createSetupBoolComponent(
  command: Command,
): React.FC<SetupProps<boolean> & BoolExtraProps> {
  const {name} = command;
  const key = camelize(name);

  return function SetupBoolComponent({
    value,
    hasLabel = false,
    isInverted = false,
    label,
  }) {
    return (
      <BoolParameter
        name={name}
        isTrue={value}
        target={buildSetupTarget(key)}
        isInverted={isInverted}
        hasLabel={hasLabel}
        label={label}
      />
    );
  };
}

function createSetupNumberComponent(
  command: Command,
): React.FC<SetupProps<number> & NumberExtraProps> {
  const {name, unit, min, max, step} = command;
  const key = camelize(name);

  return function SetupNumberComponent({
    value,
    hasLabel = false,
    formatter,
    labelFormatter,
  }) {
    return (
      <NumberParameter
        name={name}
        unit={unit ?? ''}
        value={value}
        target={buildSetupTarget(key)}
        min={min ?? 0}
        max={max ?? 100}
        step={step ?? 1}
        hasLabel={hasLabel}
        formatter={formatter}
        labelFormatter={labelFormatter}
      />
    );
  };
}

function createInputEnumComponent(
  command: Command,
): React.FC<InputProps<string>> {
  const {name, values, unit} = command;
  const key = camelize(name);

  return function InputEnumComponent({id, value, hasLabel = false}) {
    return (
      <EnumParameter
        name={name}
        unit={unit}
        value={value}
        target={buildInputTarget(id, key)}
        enums={values ? [...values] : []}
        hasLabel={hasLabel}
      />
    );
  };
}

function createInputBoolComponent(
  command: Command,
): React.FC<InputProps<boolean> & BoolExtraProps> {
  const {name} = command;
  const key = camelize(name);

  return function InputBoolComponent({
    id,
    value,
    hasLabel = false,
    isInverted = false,
    label,
  }) {
    return (
      <BoolParameter
        name={name}
        isTrue={value}
        target={buildInputTarget(id, key)}
        isInverted={isInverted}
        hasLabel={hasLabel}
        label={label}
      />
    );
  };
}

function createInputNumberComponent(
  command: Command,
): React.FC<InputProps<number> & NumberExtraProps> {
  const {name, unit, min, max, step} = command;
  const key = camelize(name);

  return function InputNumberComponent({
    id,
    value,
    hasLabel = false,
    formatter,
    labelFormatter,
  }) {
    return (
      <NumberParameter
        name={name}
        unit={unit ?? ''}
        value={value}
        target={buildInputTarget(id, key)}
        min={min ?? 0}
        max={max ?? 100}
        step={step ?? 1}
        hasLabel={hasLabel}
        formatter={formatter}
        labelFormatter={labelFormatter}
      />
    );
  };
}

function createOutputEnumComponent(
  command: Command,
): React.FC<OutputProps<string>> {
  const {name, values, unit} = command;
  const key = camelize(name);

  return function OutputEnumComponent({id, value, hasLabel = false}) {
    return (
      <EnumParameter
        name={name}
        unit={unit}
        value={value}
        target={buildOutputTarget(id, key)}
        enums={values ? [...values] : []}
        hasLabel={hasLabel}
      />
    );
  };
}

function createOutputBoolComponent(
  command: Command,
): React.FC<OutputProps<boolean> & BoolExtraProps> {
  const {name} = command;
  const key = camelize(name);

  return function OutputBoolComponent({
    id,
    value,
    hasLabel = false,
    isInverted = false,
    label,
  }) {
    return (
      <BoolParameter
        name={name}
        isTrue={value}
        target={buildOutputTarget(id, key)}
        isInverted={isInverted}
        hasLabel={hasLabel}
        label={label}
      />
    );
  };
}

function createOutputNumberComponent(
  command: Command,
): React.FC<OutputProps<number> & NumberExtraProps> {
  const {name, unit, min, max, step} = command;
  const key = camelize(name);

  return function OutputNumberComponent({
    id,
    value,
    hasLabel = false,
    formatter,
    labelFormatter,
  }) {
    return (
      <NumberParameter
        name={name}
        unit={unit ?? ''}
        value={value}
        target={buildOutputTarget(id, key)}
        min={min ?? 0}
        max={max ?? 100}
        step={step ?? 1}
        hasLabel={hasLabel}
        formatter={formatter}
        labelFormatter={labelFormatter}
      />
    );
  };
}

function createEqEnumComponent(command: Command): React.FC<EqProps<string>> {
  const {name, values, unit} = command;
  const key = camelize(name);

  return function EqEnumComponent({
    group,
    channelId,
    band,
    value,
    hasLabel = false,
  }) {
    return (
      <EnumParameter
        name={name}
        unit={unit}
        value={value}
        target={buildEqTarget(group, channelId, band, key)}
        enums={values ? [...values] : []}
        hasLabel={hasLabel}
      />
    );
  };
}

function createEqNumberComponent(
  command: Command,
): React.FC<EqProps<number> & NumberExtraProps> {
  const {name, unit, min, max, step} = command;
  const key = camelize(name);

  return function EqNumberComponent({
    group,
    channelId,
    band,
    value,
    hasLabel = false,
    formatter,
    labelFormatter,
  }) {
    return (
      <NumberParameter
        name={name}
        unit={unit ?? ''}
        value={value}
        target={buildEqTarget(group, channelId, band, key)}
        min={min ?? 0}
        max={max ?? 100}
        step={step ?? 1}
        hasLabel={hasLabel}
        formatter={formatter}
        labelFormatter={labelFormatter}
      />
    );
  };
}

// =============================================================================
// Generic Component Creators (dispatch by command type)
// =============================================================================

// =============================================================================
// Helper to find command by name
// =============================================================================

const squeeze = (word: string) => word.replaceAll(/\s/g, '');

function findCommand(
  commands: ReadonlyArray<Command | undefined>,
  name: string,
): Command {
  const found = commands.find(
    (c): c is Command => c !== undefined && squeeze(c.name) === name,
  );
  if (!found) throw new Error(`Command not found: ${name}`);
  return found;
}

// =============================================================================
// Namespaced Exports - Type Safe!
// =============================================================================

/** Setup parameters - no channel required */
export const setup = {
  InputSumType: createSetupEnumComponent(
    findCommand(setupCommands, 'InputSumType'),
  ),
  InputABSource: createSetupEnumComponent(
    findCommand(setupCommands, 'InputABSource'),
  ),
  InputCGain: createSetupEnumComponent(
    findCommand(setupCommands, 'InputCGain'),
  ),
  OutputConfig: createSetupEnumComponent(
    findCommand(setupCommands, 'OutputConfig'),
  ),
  Stereolink: createSetupBoolComponent(
    findCommand(setupCommands, 'Stereolink'),
  ),
  StereolinkMode: createSetupEnumComponent(
    findCommand(setupCommands, 'StereolinkMode'),
  ),
  DelayLink: createSetupBoolComponent(findCommand(setupCommands, 'DelayLink')),
  CrossoverLink: createSetupBoolComponent(
    findCommand(setupCommands, 'CrossoverLink'),
  ),
  IsDelayCorrectionOn: createSetupBoolComponent(
    findCommand(setupCommands, 'IsDelayCorrectionOn'),
  ),
  AirTemperature: createSetupNumberComponent(
    findCommand(setupCommands, 'AirTemperature'),
  ),
  DelayUnits: createSetupEnumComponent(
    findCommand(setupCommands, 'DelayUnits'),
  ),
  MuteOutsWhenPowered: createSetupBoolComponent(
    findCommand(setupCommands, 'MuteOutsWhenPowered'),
  ),
  InputASumGain: createSetupNumberComponent(
    findCommand(setupCommands, 'InputASumGain'),
  ),
  InputBSumGain: createSetupNumberComponent(
    findCommand(setupCommands, 'InputBSumGain'),
  ),
  InputCSumGain: createSetupNumberComponent(
    findCommand(setupCommands, 'InputCSumGain'),
  ),
};

/** Input channel parameters - requires id: 'A' | 'B' | 'C' | 'Sum' */
export const input = {
  Gain: createInputNumberComponent(findCommand(inputOutputCommands, 'Gain')),
  Mute: createInputBoolComponent(findCommand(inputOutputCommands, 'Mute')),
  IsDelayOn: createInputBoolComponent(
    findCommand(inputOutputCommands, 'IsDelayOn'),
  ),
  LongDelay: createInputNumberComponent(
    findCommand(inputOutputCommands, 'LongDelay'),
  ),
  IsEqualizerOn: createInputBoolComponent(
    findCommand(inputOutputCommands, 'IsEqualizerOn'),
  ),
  DynamicEqualizerAttack: createInputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerAttack'),
  ),
  DynamicEqualizerRelease: createInputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerRelease'),
  ),
  DynamicEqualizerRatio: createInputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerRatio'),
  ),
  DynamicEqualizerThreshold: createInputNumberComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerThreshold'),
  ),
  IsDynamicEqualizerOn: createInputBoolComponent(
    findCommand(inputOutputCommands, 'IsDynamicEqualizerOn'),
  ),
  DynamicEqualizerFrequency: createInputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerFrequency'),
  ),
  DynamicEqualizerQ: createInputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerQ'),
  ),
  DynamicEqualizerGain: createInputNumberComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerGain'),
  ),
  DynamicEqualizerType: createInputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerType'),
  ),
  DynamicEqualizerShelving: createInputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerShelving'),
  ),
};

/** Output channel parameters - requires id: '1' | '2' | '3' | '4' | '5' | '6' */
export const output = {
  // Common with inputs
  Gain: createOutputNumberComponent(findCommand(inputOutputCommands, 'Gain')),
  Mute: createOutputBoolComponent(findCommand(inputOutputCommands, 'Mute')),
  IsDelayOn: createOutputBoolComponent(
    findCommand(inputOutputCommands, 'IsDelayOn'),
  ),
  LongDelay: createOutputNumberComponent(
    findCommand(inputOutputCommands, 'LongDelay'),
  ),
  IsEqualizerOn: createOutputBoolComponent(
    findCommand(inputOutputCommands, 'IsEqualizerOn'),
  ),
  DynamicEqualizerAttack: createOutputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerAttack'),
  ),
  DynamicEqualizerRelease: createOutputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerRelease'),
  ),
  DynamicEqualizerRatio: createOutputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerRatio'),
  ),
  DynamicEqualizerThreshold: createOutputNumberComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerThreshold'),
  ),
  IsDynamicEqualizerOn: createOutputBoolComponent(
    findCommand(inputOutputCommands, 'IsDynamicEqualizerOn'),
  ),
  DynamicEqualizerFrequency: createOutputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerFrequency'),
  ),
  DynamicEqualizerQ: createOutputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerQ'),
  ),
  DynamicEqualizerGain: createOutputNumberComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerGain'),
  ),
  DynamicEqualizerType: createOutputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerType'),
  ),
  DynamicEqualizerShelving: createOutputEnumComponent(
    findCommand(inputOutputCommands, 'DynamicEqualizerShelving'),
  ),
  // Output-only
  ChannelName: createOutputEnumComponent(
    findCommand(outputCommands, 'ChannelName'),
  ),
  Source: createOutputEnumComponent(findCommand(outputCommands, 'Source')),
  HighpassFilter: createOutputEnumComponent(
    findCommand(outputCommands, 'HighpassFilter'),
  ),
  HighpassFrequency: createOutputEnumComponent(
    findCommand(outputCommands, 'HighpassFrequency'),
  ),
  LowpassFilter: createOutputEnumComponent(
    findCommand(outputCommands, 'LowpassFilter'),
  ),
  LowpassFrequency: createOutputEnumComponent(
    findCommand(outputCommands, 'LowpassFrequency'),
  ),
  IsLimiterOn: createOutputBoolComponent(
    findCommand(outputCommands, 'IsLimiterOn'),
  ),
  LimiterThreshold: createOutputNumberComponent(
    findCommand(outputCommands, 'LimiterThreshold'),
  ),
  LimiterRelease: createOutputEnumComponent(
    findCommand(outputCommands, 'LimiterRelease'),
  ),
  Polarity: createOutputEnumComponent(findCommand(outputCommands, 'Polarity')),
  Phase: createOutputNumberComponent(findCommand(outputCommands, 'Phase')),
  ShortDelay: createOutputNumberComponent(
    findCommand(outputCommands, 'ShortDelay'),
  ),
};

/** Equalizer band parameters - requires group, channelId, and band number */
export const eq = {
  Frequency: createEqEnumComponent(
    findCommand(equalizerCommands, 'EqualizerFrequency'),
  ),
  Q: createEqEnumComponent(findCommand(equalizerCommands, 'EqualizerQ')),
  Gain: createEqNumberComponent(
    findCommand(equalizerCommands, 'EqualizerGain'),
  ),
  Type: createEqEnumComponent(findCommand(equalizerCommands, 'EqualizerType')),
  Shelving: createEqEnumComponent(
    findCommand(equalizerCommands, 'EqualizerShelving'),
  ),
};
