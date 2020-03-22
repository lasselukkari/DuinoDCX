import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Form from 'react-bootstrap/Form';

class EnumParameter extends Component {
  static defaultProps = {
    hasLabel: false,
    eq: null,
    channelId: null,
    group: null,
    unit: null
  };

  static propTypes = {
    value: PropTypes.string.isRequired,
    unit: PropTypes.string,
    enums: PropTypes.arrayOf(PropTypes.string).isRequired,
    param: PropTypes.string.isRequired,
    group: PropTypes.string,
    channelId: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    eq: PropTypes.string,
    name: PropTypes.string.isRequired,
    hasLabel: PropTypes.bool
  };

  handleValueChange = (event) => {
    const {param, group, channelId, eq, onChange} = this.props;
    onChange({param, group, channelId, eq, value: event.target.value});
  };

  shouldComponentUpdate(nextProps) {
    const {value} = this.props;
    return value !== nextProps.value;
  }

  render() {
    const {name, value, enums, unit, hasLabel} = this.props;
    return (
      <Form.Group>
        {hasLabel !== false && (
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
          {enums.map((enumeral) => (
            <option key={enumeral}>{enumeral}</option>
          ))}
        </Form.Control>
      </Form.Group>
    );
  }
}

export default EnumParameter;
