import React, {Component} from 'react';
import {Form} from 'react-bootstrap';

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
      <Form.Group>
        {includeLabel !== false && (
          <Form.Label>
            {name} {unit && `(${unit})`}
          </Form.Label>
        )}
        <Form.Control
          as="select"
          placeholder="select"
          value={value}
          onChange={this.handleValueChange}
        >
          {enums.map(enumeral => (
            <option key={enumeral}>{enumeral}</option>
          ))}
        </Form.Control>
      </Form.Group>
    );
  }
}

EnumParam.defaultProps = {
  includeLabel: false
};

export default EnumParam;
