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
    isDelayCorrectionOn: PropTypes.bool.isRequired
  };

  handleValueChange = (event) => {
    const {onChange, delayUnits} = this.props;
    const {value} = event.target;

    const unlocalizedValue =
      delayUnits === 'mm' ? Number(value) : ((value - 32) * 5) / 9;

    onChange({param: 'airTemperature', value: unlocalizedValue});
  };

  handleCorrectionChange = (isDelayCorrectionOn) => {
    const {onChange} = this.props;
    onChange({
      param: 'isDelayCorrectionOn',
      value: !isDelayCorrectionOn
    });
  };

  render() {
    const toFahrenheit = (value) => (value * 9) / 5 + 32;
    const {airTemperature, isDelayCorrectionOn, delayUnits} = this.props;
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
          disabled={!isDelayCorrectionOn}
          value={value.toFixed(1)}
          as="select"
          placeholder="select"
          onChange={this.handleValueChange}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </FormControl>
        <InputGroup.Append>
          <Button
            variant={isDelayCorrectionOn ? 'success' : 'primary'}
            onClick={() => this.handleCorrectionChange(isDelayCorrectionOn)}
          >
            °{unit}
          </Button>
        </InputGroup.Append>
      </InputGroup>
    );
  }
}

export default Temperature;
