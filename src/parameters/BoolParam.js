import React, {Component} from 'react';
import {ControlLabel, FormGroup, Button, Form} from 'react-bootstrap';

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
            <ControlLabel>
              {name}
              <br />
            </ControlLabel>
          )}

          <Button
            block
            bsSize="small"
            bsStyle={value ? onColor : 'primary'}
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
