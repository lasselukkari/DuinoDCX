import React, {Component} from 'react';
import {FormGroup, ControlLabel, Button, Glyphicon} from 'react-bootstrap';
import Slider, {createSliderWithTooltip} from 'rc-slider';
import './NumberParam.css'; // eslint-disable-line import/no-unassigned-import
import 'rc-slider/assets/index.css'; // eslint-disable-line import/no-unassigned-import

const SliderWithTooltip = createSliderWithTooltip(Slider);

class NumberParam extends Component {
  shouldComponentUpdate(nextProps) {
    const {value, unit, formatter} = this.props;

    return (
      formatter(value, unit) !==
      nextProps.formatter(nextProps.value, nextProps.unit)
    );
  }

  handleValueChange = value => {
    const {param, group, channelId, eq, onChange} = this.props;
    onChange({param, group, channelId, eq, value});
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
                key={value}
                defaultValue={value}
                handleStyle={handlerStyle}
                marks={marks}
                max={max}
                min={min}
                step={step}
                tipFormatter={value => formatter(value, unit)}
                onAfterChange={this.handleValueChange}
              />
            </div>
            <h6>{formatter(value, unit)}</h6>
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
