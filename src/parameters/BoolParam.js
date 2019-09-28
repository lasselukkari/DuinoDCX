import React, {Component} from 'react';
import PropTypes from 'prop-types';
import FormGroup from 'react-bootstrap/FormGroup';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

class BoolParam extends Component {
  static defaultProps = {
    includeLabel: false,
    inverted: false,
    channelId: null,
    eq: null,
    group: null
  };

  static propTypes = {
    value: PropTypes.bool.isRequired,
    inverted: PropTypes.bool,
    param: PropTypes.string.isRequired,
    group: PropTypes.string,
    channelId: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    eq: PropTypes.string,
    name: PropTypes.string.isRequired,
    includeLabel: PropTypes.bool
  };

  handleClick = () => {
    const {param, group, channelId, eq, onChange, value} = this.props;
    onChange({param, group, channelId, eq, value: !value});
  };

  shouldComponentUpdate(nextProps) {
    const {value} = this.props;
    return value !== nextProps.value;
  }

  render() {
    const {name, value, inverted, includeLabel} = this.props;
    const onColor = inverted ? 'danger' : 'success';

    return (
      <Form>
        <FormGroup>
          {includeLabel !== false && (
            <Form.Label>
              {name}
              <br />
            </Form.Label>
          )}

          <Button
            block
            variant={value ? onColor : 'primary'}
            active={value}
            onClick={this.handleClick}
          >
            {value ? 'On' : 'Off'}
          </Button>
        </FormGroup>
      </Form>
    );
  }
}

export default BoolParam;
