import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  FormGroup,
  FormLabel,
  Button,
  Popover,
  OverlayTrigger,
  InputGroup
} from 'react-bootstrap';
import Slider, {createSliderWithTooltip} from 'rc-slider';
import {FaPlus, FaMinus} from 'react-icons/fa';
import NumericInput from 'react-numeric-input';
import './NumberParam.css'; // eslint-disable-line import/no-unassigned-import
import 'rc-slider/assets/index.css'; // eslint-disable-line import/no-unassigned-import

const SliderWithTooltip = createSliderWithTooltip(Slider);

class NumberParam extends Component {
  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.moving !== true) {
      return {value: nextProps.value};
    }

    return null;
  }

  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      manualValue: props.value
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {value, unit, formatter} = this.props;

    return (
      formatter(value, unit) !==
        nextProps.formatter(nextProps.value, nextProps.unit) ||
      nextState.value !== this.state.value
    );
  }

  handleOnBeforeChange = () => this.setState({moving: true});

  handleOnChange = value => this.setState({value});

  handleManualChange = manualValue => this.setState({manualValue});

  handleManualSet = () => {
    const {param, group, channelId, eq, onChange} = this.props;
    const {manualValue: value} = this.state;

    onChange({param, group, channelId, eq, value});
    this.overlay.hide();
  };

  handleOnAfterChange = newValue => {
    const {
      name,
      unit,
      param,
      group,
      channelId,
      eq,
      onChange,
      confirm,
      value: oldValue,
      formatter
    } = this.props;

    if (newValue.toFixed(3) === oldValue.toFixed(3)) {
      return this.setState({moving: false});
    }

    confirm({oldValue, newValue, unit, name, formatter})
      .then(() => {
        this.setState({moving: false, manualValue: newValue});
        onChange({param, group, channelId, eq, value: newValue});
      })
      .catch(() => {
        return this.setState({moving: false, value: oldValue});
      });
  };

  handleReduction = () => {
    const {
      value,
      min,
      step,
      param,
      group,
      channelId,
      eq,
      onChange
    } = this.props;
    if (value - step >= min) {
      onChange({param, group, channelId, eq, value: value - step});
    }
  };

  handleAddition = () => {
    const {
      value,
      max,
      step,
      param,
      group,
      channelId,
      eq,
      onChange
    } = this.props;
    if (value + step <= max) {
      onChange({param, group, channelId, eq, value: value + step});
    }
  };

  handleReductionPress = () => {
    this.pressTimer = setInterval(() => this.handleReduction(), 150);
  };

  handleAdditionPress = () => {
    this.pressTimer = setInterval(() => this.handleAddition(), 150);
  };

  handlePressRelease = () => clearTimeout(this.pressTimer);

  createRef = overlay => {
    if (!overlay) {
      return;
    }

    const {handleHide} = overlay;
    overlay.handleHide = () => {
      this.setState(({value: manualValue}) => ({manualValue}));
      handleHide();
    };

    this.overlay = overlay;
  };

  render() {
    const {
      name,
      unit,
      value,
      min,
      max,
      step,
      includeLabel,
      formatter,
      labelFormatter
    } = this.props;

    const marks = {
      [min.toString()]: {
        style: {marginTop: '3px'},
        label: labelFormatter(min, unit)
      },
      [max.toString()]: {
        style: {marginTop: '3px'},
        label: labelFormatter(max, unit)
      }
    };

    const handlerStyle = {
      height: 30,
      width: 30,
      marginLeft: -15,
      marginTop: -15
    };

    const popover = (
      <Popover id="popover-positioned-right">
        <FormGroup style={{margin: '10px 5px'}}>
          <InputGroup>
            <NumericInput
              snap
              min={min}
              max={max}
              step={step}
              value={this.state.value}
              precision={2}
              onChange={this.handleManualChange}
            />

            <Button onClick={this.handleManualSet}>Set</Button>
          </InputGroup>
        </FormGroup>
      </Popover>
    );

    return (
      <FormGroup>
        {includeLabel !== false && (
          <FormLabel>
            {name}
            <br />
          </FormLabel>
        )}

        <div className="number-param-container">
          <div className="min-number">
            <Button
              onTouchStart={this.handleReductionPress}
              onTouchEnd={this.handlePressRelease}
              onMouseDown={this.handleReductionPress}
              onMouseUp={this.handlePressRelease}
              onMouseLeave={this.handlePressRelease}
              onClick={this.handleReduction}
            >
              <FaMinus />
            </Button>
          </div>
          <div className="slider">
            <div className="slider-container">
              <SliderWithTooltip
                value={this.state.value}
                handleStyle={handlerStyle}
                marks={marks}
                max={max}
                min={min}
                step={step}
                tipFormatter={value => formatter(value, unit)}
                onChange={this.handleOnChange}
                onBeforeChange={this.handleOnBeforeChange}
                onAfterChange={this.handleOnAfterChange}
              />
            </div>
            <OverlayTrigger
              ref={this.createRef}
              overlay={popover}
              placement="top" // eslint-disable-line react/jsx-sort-props
              rootClose
              trigger="click"
            >
              <button type="button" className="value-button">
                {formatter(value, unit)}
              </button>
            </OverlayTrigger>
          </div>
          <div className="max-number">
            <Button
              onTouchStart={this.handleAdditionPress}
              onTouchEnd={this.handlePressRelease}
              onMouseDown={this.handleAdditionPress}
              onMouseUp={this.handlePressRelease}
              onMouseLeave={this.handlePressRelease}
              onClick={this.handleAddition}
            >
              <FaPlus />
            </Button>
          </div>
        </div>
      </FormGroup>
    );
  }
}

NumberParam.defaultProps = {
  formatter: (value, unit) =>
    `${Math.round(value * 10) / 10} ${unit ? unit : ''}`,
  labelFormatter: value => value.toString(),
  includeLabel: false,
  confirm: () => Promise.resolve(),
  group: null,
  eq: null,
  channelId: null
};

NumberParam.propTypes = {
  value: PropTypes.number.isRequired,
  unit: PropTypes.string.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  formatter: PropTypes.func,
  param: PropTypes.string.isRequired,
  group: PropTypes.string,
  channelId: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  eq: PropTypes.string,
  name: PropTypes.string.isRequired,
  confirm: PropTypes.func,
  includeLabel: PropTypes.bool,
  labelFormatter: PropTypes.func
};

export default NumberParam;
