import React, {Component} from 'react';
import {Panel, Row, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import pc from './parameters';

class InputRouting extends Component {
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
        <Panel>
          <Panel.Heading>Source Setup</Panel.Heading>
          <Panel.Body>
            <Row>
              <Col xs={12} sm={4}>
                <pc.InputABSource
                  includeLabel
                  value={inputABSource}
                  onChange={onChange}
                />
              </Col>
              <Col xs={12} sm={4}>
                <pc.InputCGain
                  includeLabel
                  value={inputCGain}
                  onChange={onChange}
                />
              </Col>
              <Col xs={12} sm={4}>
                <pc.StereolinkMode
                  includeLabel
                  value={stereolinkMode}
                  onChange={onChange}
                />
              </Col>
            </Row>
          </Panel.Body>
        </Panel>
        <Panel>
          <Panel.Heading>Sum Setup</Panel.Heading>
          <Panel.Body>
            <pc.InputSumType
              includeLabel
              value={inputSumType}
              onChange={onChange}
            />
            <pc.InputASumGain
              includeLabel
              value={inputASumGain}
              onChange={onChange}
            />
            <pc.InputBSumGain
              includeLabel
              value={inputBSumGain}
              onChange={onChange}
            />
            <pc.InputCSumGain
              includeLabel
              value={inputCSumGain}
              onChange={onChange}
            />
          </Panel.Body>
        </Panel>
      </div>
    );
  }
}

export default InputRouting;
