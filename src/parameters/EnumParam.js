import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Form from 'react-bootstrap/Form';

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
  includeLabel: false,
  eq: null,
  channelId: null,
  group: null,
  unit: null
};

EnumParam.propTypes = {
  value: PropTypes.string.isRequired,
  unit: PropTypes.string,
  enums: PropTypes.arrayOf(PropTypes.string).isRequired,
  param: PropTypes.string.isRequired,
  group: PropTypes.string,
  channelId: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  eq: PropTypes.string,
  name: PropTypes.string.isRequired,
  includeLabel: PropTypes.bool
};

export default EnumParam;
