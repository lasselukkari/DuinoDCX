import React, {Component} from 'react';
import PropTypes from 'prop-types';
import FormGroup from 'react-bootstrap/FormGroup';
import FormLabel from 'react-bootstrap/FormLabel';
import Button from 'react-bootstrap/Button';
import Dialog from 'react-bootstrap-dialog';
import Slider, {createSliderWithTooltip} from 'rc-slider';
import {FaPlus, FaMinus} from 'react-icons/fa';

import './NumberParameter.css';
import 'rc-slider/assets/index.css';

const SliderWithTooltip = createSliderWithTooltip(Slider);

class NumberParameter extends Component {
  static getDerivedStateFromProps(nextProps, previousState) {
    if (previousState.moving !== true) {
      return {value: nextProps.value};
    }

    return null;
  }

  static defaultProps = {
    formatter: (value, unit) =>
      `${Math.round(value * 10) / 10} ${unit ? unit : ''}`,
    labelFormatter: (value) => value.toString(),
    hasLabel: false,
    group: null,
    eq: null,
    channelId: null
  };

  static propTypes = {
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
    hasLabel: PropTypes.bool,
    labelFormatter: PropTypes.func
  };

  state = {
    value: this.props.value
  };

  shouldComponentUpdate(nextProps, nextState) {
    const {value, unit, formatter} = this.props;

    return (
      formatter(value, unit) !==
        nextProps.formatter(nextProps.value, nextProps.unit) ||
      nextState.value !== this.state.value
    );
  }

  handleOnBeforeChange = () => this.setState({moving: true});

  handleOnChange = (value) => this.setState({value});

  showConfirmChange = ({oldValue, newValue, name, unit, formatter}) => {
    return new Promise((resolve, reject) => {
      if (newValue <= oldValue) {
        return resolve();
      }

      this.dialog.show({
        title: 'Confirm change',
        body: (
          <div style={{textAlign: 'center'}}>
            <p>
              You are about to change {name.toLowerCase()} from{' '}
              {formatter(oldValue, unit)} to {formatter(newValue, unit)}.
            </p>
            <p>
              This is {formatter(newValue - oldValue, unit)} increase. Are you
              sure?
            </p>
          </div>
        ),
        bsSize: 'md',
        actions: [
          Dialog.CancelAction(() => reject()), // eslint-disable-line new-cap
          Dialog.OKAction(() => resolve()) // eslint-disable-line new-cap
        ],
        onHide: () => {}
      });
    });
  };

  async confirmChange(newValue) {
    const {
      name,
      unit,
      param,
      group,
      channelId,
      eq,
      onChange,
      value: oldValue,
      formatter
    } = this.props;

    if (newValue.toFixed(3) === oldValue.toFixed(3)) {
      return this.setState({moving: false});
    }

    try {
      await this.showConfirmChange({oldValue, newValue, unit, name, formatter});
      onChange({param, group, channelId, eq, value: newValue});
    } catch {
      this.setState({moving: false, value: oldValue});
    }
  }

  handleOnAfterChange = (newValue) => this.confirmChange(newValue);

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
      hasLabel,
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
      marginTop: -15
    };

    return (
      <FormGroup>
        {hasLabel !== false && (
          <FormLabel>
            {name}
            <br />
          </FormLabel>
        )}

        <div className="number-param-container">
          <div className="min-number">
            <Button onClick={this.handleReduction}>
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
                tipFormatter={(value) => formatter(value, unit)}
                onChange={this.handleOnChange}
                onBeforeChange={this.handleOnBeforeChange}
                onAfterChange={this.handleOnAfterChange}
              />
            </div>
            <div className="current-value">{formatter(value, unit)}</div>
          </div>
          <div className="max-number">
            <Button onClick={this.handleAddition}>
              <FaPlus />
            </Button>
          </div>
        </div>
        <Dialog
          ref={(element) => {
            this.dialog = element;
          }}
        />
      </FormGroup>
    );
  }
}

export default NumberParameter;
