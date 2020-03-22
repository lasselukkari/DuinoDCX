import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import Parser from '../dcx2496/parser';
import BoolParameter from './BoolParameter';
import EnumParameter from './EnumParameter';
import NumberParameter from './NumberParameter';

const components = {};
const commandTypes = {
  SETUP_COMMAND: 0,
  EQ_COMMAND: 1,
  IO_COMMAND: 2,
  OUTPUT_COMMAND: 3
};

const enumComponent = function ({name, unit, values}, type) {
  class EnumComponent extends PureComponent {
    static propTypes = {
      value: PropTypes.string.isRequired,
      group: PropTypes.string,
      channelId: PropTypes.string,
      onChange: PropTypes.func.isRequired,
      eq: PropTypes.string,
      hasLabel: PropTypes.bool
    };

    static defaultProps = {
      hasLabel: false,
      eq: null,
      channelId: null,
      group: null
    };

    render() {
      const {value, group, channelId, eq, onChange, hasLabel} = this.props;
      return (
        <EnumParameter
          name={name}
          type={type}
          unit={unit}
          value={value}
          param={Parser.camelize(name)}
          group={group}
          channelId={channelId}
          eq={eq}
          enums={values}
          hasLabel={hasLabel}
          onChange={onChange}
        />
      );
    }
  }

  return EnumComponent;
};

const boolComponent = function ({name}, type) {
  class BoolComponent extends PureComponent {
    static defaultProps = {
      hasLabel: false,
      label: null,
      isInverted: false,
      eq: null,
      group: null,
      channelId: null
    };

    static propTypes = {
      isTrue: PropTypes.bool.isRequired,
      isInverted: PropTypes.bool,
      group: PropTypes.string,
      channelId: PropTypes.string,
      onChange: PropTypes.func.isRequired,
      eq: PropTypes.string,
      hasLabel: PropTypes.bool,
      label: PropTypes.string
    };

    render() {
      const {
        isTrue,
        group,
        channelId,
        eq,
        isInverted,
        onChange,
        hasLabel,
        label
      } = this.props;
      return (
        <BoolParameter
          name={name}
          type={type}
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
    }
  }

  return BoolComponent;
};

const numberComponent = function ({name, unit, min, max, step}, type) {
  class NumberComponent extends PureComponent {
    static defaultProps = {
      formatter: (value, unit) =>
        `${Math.round(value * 10) / 10} ${unit ? unit : ''}`,
      labelFormatter: (value) => value.toString(),
      hasLabel: false,
      eq: null,
      group: null,
      channelId: null,
      confirm: () => Promise.resolve()
    };

    static propTypes = {
      value: PropTypes.number.isRequired,
      formatter: PropTypes.func,
      group: PropTypes.string,
      channelId: PropTypes.string,
      onChange: PropTypes.func.isRequired,
      eq: PropTypes.string,
      confirm: PropTypes.func,
      hasLabel: PropTypes.bool,
      labelFormatter: PropTypes.func
    };

    render() {
      const {
        value,
        group,
        channelId,
        eq,
        onChange,
        formatter,
        hasLabel,
        confirm,
        labelFormatter
      } = this.props;
      return (
        <NumberParameter
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
          hasLabel={hasLabel}
          formatter={formatter}
          confirm={confirm}
          labelFormatter={labelFormatter}
          onChange={onChange}
        />
      );
    }
  }

  return NumberComponent;
};

const createComponent = (commmand) => {
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

const squeeze = (word) => word.replace(/\s/g, '');

Parser.commands.setupCommands.forEach((command) => {
  components[squeeze(command.name)] = createComponent(command);
});

Parser.commands.inputOutputCommands.forEach((command) => {
  components[squeeze(command.name)] = createComponent(command);
});

Parser.commands.eqCommands.forEach((command) => {
  components[squeeze(command.name)] = createComponent(command);
});

Parser.commands.outputCommands.forEach((command) => {
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
  commandTypes
};
