import React, {Component} from 'react';
import PropTypes from 'prop-types';
import FormGroup from 'react-bootstrap/FormGroup';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

class BoolParameter extends Component {
  static defaultProps = {
    label: null,
    hasLabel: false,
    isInverted: false,
    channelId: null,
    eq: null,
    group: null
  };

  static propTypes = {
    isTrue: PropTypes.bool.isRequired,
    isInverted: PropTypes.bool,
    param: PropTypes.string.isRequired,
    group: PropTypes.string,
    channelId: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    eq: PropTypes.string,
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    hasLabel: PropTypes.bool
  };

  handleClick = () => {
    const {param, group, channelId, eq, onChange, isTrue} = this.props;

    onChange({param, group, channelId, eq, value: !isTrue});
  };

  shouldComponentUpdate(nextProps) {
    const {isTrue} = this.props;
    return isTrue !== nextProps.isTrue;
  }

  render() {
    const {name, isTrue, isInverted, hasLabel, label} = this.props;
    const onColor = isInverted ? 'danger' : 'success';

    return (
      <Form>
        <FormGroup>
          {(label || hasLabel !== false) && (
            <Form.Label>
              {label ? label : name}
              <br />
            </Form.Label>
          )}

          <Button
            block
            variant={isTrue ? onColor : 'primary'}
            active={isTrue}
            onClick={this.handleClick}
          >
            {isTrue ? 'On' : 'Off'}
          </Button>
        </FormGroup>
      </Form>
    );
  }
}

export default BoolParameter;
