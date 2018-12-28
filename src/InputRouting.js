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

    const confirm = ({oldValue, newValue, name, unit, formatter}) => {
      if (newValue - oldValue > 6) {
        // eslint-disable-next-line no-alert
        return window.confirm(
          `You are about to change ${name.toLowerCase()} from ${formatter(
            oldValue,
            unit
          )} to ${formatter(newValue, unit)} (+${formatter(
            newValue - oldValue,
            unit
          )}). Are you sure?`
        );
      }

      return true;
    };

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
              confirm={confirm}
              onChange={onChange}
            />
            <pc.InputBSumGain
              includeLabel
              value={inputBSumGain}
              confirm={confirm}
              onChange={onChange}
            />
            <pc.InputCSumGain
              includeLabel
              value={inputCSumGain}
              confirm={confirm}
              onChange={onChange}
            />
          </Panel.Body>
        </Panel>
      </div>
    );
  }
}

export default InputRouting;
