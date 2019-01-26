import React, {Component} from 'react';
import {
  FormGroup,
  ControlLabel,
  Button,
  Glyphicon,
  Popover,
  OverlayTrigger,
  InputGroup
} from 'react-bootstrap';
import Slider, {createSliderWithTooltip} from 'rc-slider';
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

    if (confirm && !confirm({oldValue, newValue, unit, name, formatter})) {
      return this.setState({moving: false, value: oldValue});
    }

    this.setState({moving: false});
    onChange({param, group, channelId, eq, value: newValue});
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

  createRef = overlay => {
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
        style: {
          left: '-10px',
          margin: '1px 6px',
          width: 'auto'
        },
        label: labelFormatter(min, unit)
      },
      [max.toString()]: {
        style: {
          right: '-10px',
          margin: '1px 6px',
          width: 'auto',
          left: 'auto'
        },
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
            <InputGroup.Button>
              <Button onClick={this.handleManualSet}>Set</Button>
            </InputGroup.Button>
          </InputGroup>
        </FormGroup>
      </Popover>
    );

    return (
      <FormGroup>
        {includeLabel !== false && (
          <ControlLabel>
            {name}
            <br />
          </ControlLabel>
        )}

        <div className="number-param-container">
          <div className="min-number">
            <Button onClick={this.handleReduction}>
              <Glyphicon glyph="minus" />
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
            <Button onClick={this.handleAddition}>
              <Glyphicon glyph="plus" />
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
  includeLabel: false
};

export default NumberParam;
