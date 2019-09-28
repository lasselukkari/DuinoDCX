import React, {PureComponent} from 'react';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import PropTypes from 'prop-types';

class Temperature extends PureComponent {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    delayUnits: PropTypes.string.isRequired,
    airTemperature: PropTypes.number.isRequired,
    delayCorrection: PropTypes.bool.isRequired
  };

  handleValueChange = e => {
    const {onChange, delayUnits} = this.props;
    const {value} = e.target;

    const unlocalizedValue =
      delayUnits === 'mm' ? Number(value) : ((value - 32) * 5) / 9;

    onChange({param: 'airTemperature', value: unlocalizedValue});
  };

  handleCorrectionChange = delayCorrection => {
    const {onChange} = this.props;
    onChange({param: 'delayCorrection', value: !delayCorrection});
  };

  render() {
    const toFahrenheit = value => (value * 9) / 5 + 32;
    const {airTemperature, delayCorrection, delayUnits} = this.props;
    const unit = delayUnits === 'mm' ? 'C' : 'F';
    const min = delayUnits === 'mm' ? -20 : toFahrenheit(-20);
    const max = delayUnits === 'mm' ? 50 : toFahrenheit(50);
    const value =
      delayUnits === 'mm' ? airTemperature : toFahrenheit(airTemperature);
    const step = delayUnits === 'mm' ? 1 : 9 / 5;

    const options = [];
    for (let i = min; i <= max; i += step) {
      options.push(i.toFixed(1));
    }

    return (
      <InputGroup>
        <FormControl
          disabled={!delayCorrection}
          value={value.toFixed(1)}
          as="select"
          placeholder="select"
          onChange={this.handleValueChange}
        >
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </FormControl>
        <InputGroup.Append>
          <Button
            variant={delayCorrection ? 'success' : 'primary'}
            onClick={() => this.handleCorrectionChange(delayCorrection)}
          >
            °{unit}
          </Button>
        </InputGroup.Append>
      </InputGroup>
    );
  }
}

export default Temperature;
