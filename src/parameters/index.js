import React, {PureComponent} from 'react';
import Parser from '../dcx2496/parser';
import BoolParam from './BoolParam';
import EnumParam from './EnumParam';
import NumberParam from './NumberParam';

const components = {};
const commandTypes = {
  SETUP_COMMAND: 0,
  EQ_COMMAND: 1,
  IO_COMMAND: 2,
  OUTPUT_COMMAND: 3
};

const enumComponent = function({name, unit, values}, type) {
  class EnumComponent extends PureComponent {
    render() {
      const {value, group, channelId, eq, onChange, includeLabel} = this.props;
      return (
        <EnumParam
          name={name}
          type={type}
          unit={unit}
          value={value}
          param={Parser.camelize(name)}
          group={group}
          channelId={channelId}
          eq={eq}
          enums={values}
          includeLabel={includeLabel}
          onChange={onChange}
        />
      );
    }
  }

  return EnumComponent;
};

const boolComponent = function({name}, type) {
  class BoolComponent extends PureComponent {
    render() {
      const {
        value,
        group,
        channelId,
        eq,
        inverted,
        onChange,
        includeLabel
      } = this.props;
      return (
        <BoolParam
          name={name}
          type={type}
          value={value}
          param={Parser.camelize(name)}
          group={group}
          channelId={channelId}
          eq={eq}
          inverted={inverted}
          includeLabel={includeLabel}
          onChange={onChange}
        />
      );
    }
  }

  return BoolComponent;
};

const numberComponent = function({name, unit, min, max, step}, type) {
  return class extends PureComponent {
    render() {
      const {
        value,
        group,
        channelId,
        eq,
        onChange,
        formatter,
        includeLabel,
        confirm,
        labelFormatter
      } = this.props;
      return (
        <NumberParam
          name={name}
          type={type}
          unit={unit}
          value={value}
          param={Parser.camelize(name)}
          group={group}
          channelId={channelId}
          min={min}
          max={max}
          step={step}
          eq={eq}
          includeLabel={includeLabel}
          formatter={formatter}
          confirm={confirm}
          labelFormatter={labelFormatter}
          onChange={onChange}
        />
      );
    }
  };
};

const createComponent = commmand => {
  if (commmand.type === 'enum') {
    return enumComponent(commmand);
  }

  if (commmand.type === 'bool') {
    return boolComponent(commmand);
  }

  if (commmand.type === 'number') {
    return numberComponent(commmand);
  }
};

const squeeze = word => word.replace(/\s/g, '');

Parser.commands.setupCommands.forEach(command => {
  components[squeeze(command.name)] = createComponent(command);
});

Parser.commands.inputOutputCommands.forEach(command => {
  components[squeeze(command.name)] = createComponent(command);
});

Parser.commands.eqCommands.forEach(command => {
  components[squeeze(command.name)] = createComponent(command);
});

Parser.commands.outputCommands.forEach(command => {
  components[squeeze(command.name)] = createComponent(command);
});

export default {
  // Setup components
  InputSumType: components.InputSumType,
  InputABSource: components.InputABSource,
  InputCGain: components.InputCGain,
  OutputConfig: components.OutputConfig,
  Stereolink: components.Stereolink,
  StereolinkMode: components.StereolinkMode,
  DelayLink: components.DelayLink,
  CrossoverLink: components.CrossoverLink,
  DelayCorrection: components.DelayCorrection,
  AirTemperature: components.AirTemperature,
  DelayUnits: components.DelayUnits,
  MuteOutsWhenPowered: components.MuteOutsWhenPowered,
  InputASumGain: components.InputASumGain,
  InputBSumGain: components.InputBSumGain,
  InputCSumGain: components.InputCSumGain,

  // Io components
  Gain: components.Gain,
  Mute: components.Mute,
  Delay: components.Delay,
  LongDelay: components.LongDelay,
  EQ: components.EQ,
  EQNumber: components.EQNumber,
  EQIndex: components.EQIndex,
  DynamicEQAttack: components.DynamicEQAttack,
  DynamicEQRelease: components.DynamicEQRelease,
  DynamicEQRatio: components.DynamicEQRatio,
  DynamicEQThreshold: components.DynamicEQThreshold,
  DynamicEQ: components.DynamicEQ,
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
  Limiter: components.Limiter,
  LimiterThreshold: components.LimiterThreshold,
  LimiterRelease: components.LimiterRelease,
  Polarity: components.Polarity,
  Phase: components.Phase,
  ShortDelay: components.ShortDelay,
  commandTypes
};
