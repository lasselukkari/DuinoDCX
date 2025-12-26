import React, {Component} from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import PropTypes from 'prop-types';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import pc from './parameters';

class InputRouting extends Component {
  static propTypes = {
    setup: PropTypes.shape({
      inputABSource: PropTypes.string.isRequired,
      stereolinkMode: PropTypes.string.isRequired,
      inputSumType: PropTypes.string.isRequired,
      inputCGain: PropTypes.string.isRequired,
      inputASumGain: PropTypes.number.isRequired,
      inputBSumGain: PropTypes.number.isRequired,
      inputCSumGain: PropTypes.number.isRequired
    }).isRequired,
    onChange: PropTypes.func.isRequired
  };

  shouldComponentUpdate(nextProps) {
    const {setup} = this.props;
    return !isEqual(setup, nextProps.setup);
  }

  render() {
    const {setup, onChange} = this.props;
    const {
      inputABSource,
      inputCGain,
      stereolinkMode,
      inputSumType,
      inputASumGain,
      inputBSumGain,
      inputCSumGain
    } = setup;

    return (
      <div>
        <Card>
          <Card.Header>Source Setup</Card.Header>
          <Card.Body>
            <Row>
              <Col xs={12} sm={4}>
                <pc.InputABSource
                  hasLabel
                  value={inputABSource}
                  onChange={onChange}
                />
              </Col>
              <Col xs={12} sm={4}>
                <pc.InputCGain
                  hasLabel
                  value={inputCGain}
                  onChange={onChange}
                />
              </Col>
              <Col xs={12} sm={4}>
                <pc.StereolinkMode
                  hasLabel
                  value={stereolinkMode}
                  onChange={onChange}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>
        <Card>
          <Card.Header>Sum Setup</Card.Header>
          <Card.Body>
            <pc.InputSumType
              hasLabel
              value={inputSumType}
              onChange={onChange}
            />
            <pc.InputASumGain
              hasLabel
              value={inputASumGain}
              onChange={onChange}
            />
            <pc.InputBSumGain
              hasLabel
              value={inputBSumGain}
              onChange={onChange}
            />
            <pc.InputCSumGain
              hasLabel
              value={inputCSumGain}
              onChange={onChange}
            />
          </Card.Body>
        </Card>
      </div>
    );
  }
}

export default InputRouting;
