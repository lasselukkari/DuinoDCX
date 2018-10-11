import React, {Component} from 'react';
import {FormControl, FormGroup, ControlLabel} from 'react-bootstrap';

class EnumParam extends Component {
  handleValueChange = e => {
    const {param, group, channelId, eq, onChange} = this.props;
    onChange({param, group, channelId, eq, value: e.target.value});
  };

  shouldComponentUpdate(nextProps) {
    const {value} = this.props;
    return value !== nextProps.value;
  }

  render() {
    const {name, value, enums, unit, includeLabel} = this.props;
    return (
      <FormGroup>
        {includeLabel !== false && (
          <ControlLabel>
            {name} {unit && `(${unit})`}
          </ControlLabel>
        )}
        <FormControl
          componentClass="select"
          placeholder="select"
          value={value}
          onChange={this.handleValueChange}
        >
          {enums.map(enumeral => (
            <option key={enumeral}>{enumeral}</option>
          ))}
        </FormControl>
      </FormGroup>
    );
  }
}

EnumParam.defaultProps = {
  includeLabel: false
};

export default EnumParam;
