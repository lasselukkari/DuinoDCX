import React, {PureComponent} from 'react';
import {ToggleButtonGroup, ToggleButton} from 'react-bootstrap';

class DelayUnits extends PureComponent {
  handleValueChange = e => {
    const {onChange} = this.props;
    const {value} = e.target;
    if (value) {
      onChange({param: 'airTemperature', value: Number(value)});
    }
  };

  handleDelayUnitChange = delayUnits => {
    const {onChange} = this.props;
    onChange({param: 'delayUnits', value: delayUnits});
  };

  render() {
    const {delayUnits} = this.props;

    return (
      <ToggleButtonGroup
        type="radio"
        name="delay-units"
        defaultValue={delayUnits}
        style={{padding: '10px 0', width: '100%'}}
        onChange={this.handleDelayUnitChange}
      >
        <ToggleButton value="mm" style={{width: '50%'}}>
          °C / mm
        </ToggleButton>
        <ToggleButton value="inch" style={{width: '50%'}}>
          °F / inch
        </ToggleButton>
      </ToggleButtonGroup>
    );
  }
}

export default DelayUnits;
