import React, {Component} from 'react';
import {FormGroup, ControlLabel, Button, Glyphicon} from 'react-bootstrap';
import Slider, {Handle} from 'rc-slider';
import Tooltip from 'rc-tooltip';
import './NumberParam.css';  // eslint-disable-line import/no-unassigned-import
import 'rc-slider/assets/index.css';  // eslint-disable-line import/no-unassigned-import

const handle = props => {
  const {value, dragging, index, ...restProps} = props;
  return (
    <Tooltip
      key={index}
      prefixCls="rc-slider-tooltip"
      overlay={value}
      visible={dragging}
      placement="top"
    >
      <Handle value={value} {...restProps}/>
    </Tooltip>
  );
};

class NumberParam extends Component {
  constructor(props) {
    super(props);
    this.state = {value: props.value};
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {value: propsValue} = this.props;
    const {value: stateValue} = this.state;
    return propsValue !== nextProps.value || stateValue !== nextState.value;
  }

  componentWillReceiveProps({value}) {
    this.setState({value});
  }

  handleValueChange = value => { // eslint-disable-line no-undef
    const {param, group, channelId, eq, onChange} = this.props;
    onChange({param, group, channelId, eq, value});
  };

  handleReduction = () => { // eslint-disable-line no-undef
    const {value, min, step, param, group, channelId, eq, onChange} = this.props;
    if (value - step >= min) {
      onChange({param, group, channelId, eq, value: value + step});
    }
  };

  handleAddition = () => { // eslint-disable-line no-undef
    const {value, max, step, param, group, channelId, eq, onChange} = this.props;
    if (value + step <= max) {
      onChange({param, group, channelId, eq, value: value + step});
    }
  };

  handleSliderChange = value => { // eslint-disable-line no-undef
    this.setState({value});
  };

  render() {
    const {name, unit, value, min, max, step, includeLabel} = this.props;
    const {value: stateValue} = this.state;
    const marks = {
      [min.toString()]: {
        style: {
          left: '-10px',
          margin: '12px 0',
          width: 'auto'
        },
        label: min.toString()
      },
      [max.toString()]: {
        style: {
          right: '-10px',
          margin: '12px 0',
          width: 'auto',
          left: 'auto'
        },
        label: max.toString()
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
            <br/>
          </ControlLabel>
        )}

        <div className="number-param-container">
          <div className="min-number">
            <Button
              bsSize="small"
              onClick={this.handleReduction}
            >
              <Glyphicon glyph="minus"/>
            </Button>
          </div>
          <div className="slider">
            <h6>
              Current:
              {' '}
              {Math.round(value * 10) / 10}
              {' '}
              {unit}
            </h6>
          </div>
          <div className="max-number">
            <Button
              bsSize="small"
              onClick={this.handleAddition}
            >
              <Glyphicon glyph="plus"/>
            </Button>
          </div>
        </div>
        <div className="slider-container">
          <Slider
            handleStyle={handlerStyle}
            value={stateValue}
            onChange={this.handleSliderChange}
            onAfterChange={this.handleValueChange}
            step={step}
            min={min}
            max={max}
            marks={marks}
            handle={handle}
          />
        </div>
      </FormGroup>
    );
  }
}

export default NumberParam;
