import React, {Component} from 'react';
import {Panel, Tabs, Tab, Row, Col} from 'react-bootstrap';
import BlockUi from 'react-block-ui';
import isEqual from 'lodash.isequal';

import pc from './parameters';
import OutputSources from './OutputSources';
import ChannelNames from './ChannelNames';

class Setup extends Component {
  shouldComponentUpdate(nextProps) {
    const {blocking, outputs, setup} = this.props;
    return !(
      blocking === nextProps.blocking &&
      isEqual(outputs, nextProps.outputs) &&
      isEqual(setup, nextProps.setup)
    );
  }

  render() {
    const {setup, onChange, outputs, blocking} = this.props;
    const {
      delayCorrection,
      airTemperature,
      delayUnits,
      inputABSource,
      inputCGain,
      stereolink,
      stereolinkMode,
      muteOutsWhenPowered,
      outputConfig,
      crossoverLink,
      delayLink,
      inputSumType,
      inputASumGain,
      inputBSumGain,
      inputCSumGain
    } = setup;

    return (
      <div>
        <h2>Device Setup</h2>
        <hr />
        <Tabs defaultActiveKey="inputs" id="setup" animation={false}>
          <br />
          <Tab title="Inputs" eventKey="inputs">
            <BlockUi blocking={blocking}>
              <Panel>
                <Panel.Heading>Input Setup</Panel.Heading>
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
            </BlockUi>
          </Tab>
          <Tab title="Outputs" eventKey="ouputs">
            <BlockUi blocking={blocking}>
              <Panel>
                <Panel.Heading>Output Setup</Panel.Heading>
                <Panel.Body>
                  <Row>
                    <Col xs={12} sm={6}>
                      <pc.MuteOutsWhenPowered
                        includeLabel
                        value={muteOutsWhenPowered}
                        onChange={onChange}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <pc.OutputConfig
                        includeLabel
                        value={outputConfig}
                        onChange={onChange}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={12} sm={6}>
                      <pc.Stereolink
                        includeLabel
                        value={stereolink}
                        onChange={onChange}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <pc.CrossoverLink
                        includeLabel
                        value={crossoverLink}
                        onChange={onChange}
                      />
                    </Col>
                  </Row>
                </Panel.Body>
              </Panel>
              <OutputSources
                group="outputs"
                channels={outputs}
                xs={12}
                sm={6}
                md={4}
                onChange={onChange}
              />
              <ChannelNames
                group="outputs"
                channels={outputs}
                xs={12}
                sm={6}
                md={4}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="Sum" eventKey="sum">
            <BlockUi blocking={blocking}>
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
            </BlockUi>
          </Tab>
          <Tab title="Delay Config" eventKey="delaySetup">
            <BlockUi blocking={blocking}>
              <Panel>
                <Panel.Heading>Delay Config</Panel.Heading>
                <Panel.Body>
                  <Row>
                    <Col xs={6}>
                      <pc.DelayLink
                        includeLabel
                        value={delayLink}
                        onChange={onChange}
                      />
                    </Col>
                    <Col xs={6}>
                      <pc.DelayCorrection
                        includeLabel
                        value={delayCorrection}
                        onChange={onChange}
                      />
                    </Col>
                  </Row>
                  <pc.AirTemperature
                    includeLabel
                    value={airTemperature}
                    onChange={onChange}
                  />
                  <pc.DelayUnits
                    includeLabel
                    value={delayUnits}
                    onChange={onChange}
                  />
                </Panel.Body>
              </Panel>
            </BlockUi>
          </Tab>
        </Tabs>
      </div>
    );
  }
}

export default Setup;
