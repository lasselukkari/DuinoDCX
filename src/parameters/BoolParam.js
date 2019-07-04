import React, {Component} from 'react';
import {FormGroup, Button, Form} from 'react-bootstrap';

class BoolParam extends Component {
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

BoolParam.defaultProps = {
  includeLabel: false
};

export default BoolParam;
