import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';

class DelayUnits extends PureComponent {
  static propTypes = {
    delayUnits: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
  };

  state = {delayUnits: this.props.delayUnits};

  handleValueChange = (event) => {
    const {onChange} = this.props;
    const {value} = event.target;
    if (value) {
      onChange({param: 'airTemperature', value: Number(value)});
    }
  };

  handleDelayUnitChange = (delayUnits) => {
    const {onChange} = this.props;
    this.setState({delayUnits});
    onChange({param: 'delayUnits', value: delayUnits});
  };

  render() {
    const {delayUnits} = this.state;

    return (
      <ToggleButtonGroup
        type="radio"
        name="delay-units"
        defaultValue={delayUnits}
        style={{padding: '10px 0', width: '100%'}}
        onChange={this.handleDelayUnitChange}
      >
        <ToggleButton
          value="mm"
          variant={delayUnits === 'mm' ? 'info' : 'primary'}
          style={{width: '50%'}}
        >
          °C / mm
        </ToggleButton>
        <ToggleButton
          value="inch"
          variant={delayUnits === 'inch' ? 'info' : 'primary'}
          style={{width: '50%'}}
        >
          °F / inch
        </ToggleButton>
      </ToggleButtonGroup>
    );
  }
}

export default DelayUnits;
