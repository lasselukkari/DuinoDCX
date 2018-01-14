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
    const {delayCorrection, airTemperature, delayUnits} = setup;

    return (
      <div>
        <h2>
Device Setup
        </h2>
        <hr/>
        <Tabs defaultActiveKey="inputs" id="setup" animation={false}>
          <br/>
          <Tab title="Inputs" eventKey="inputs">
            <BlockUi blocking={blocking}>
              <Panel>
                <Row>
                  <Col xs={6}>
                    <pc.InputABSource
                      onChange={onChange}
                      value={setup.inputABSource}
                      includeLabel
                    />
                  </Col>
                  <Col xs={6}>
                    <pc.InputCGain
                      onChange={onChange}
                      value={setup.inputCGain}
                      includeLabel
                    />
                  </Col>
                </Row>
                <Row>
                  <Col xs={6}>
                    <pc.Stereolink
                      onChange={onChange}
                      value={setup.stereolink}
                      includeLabel
                    />
                  </Col>
                  <Col xs={6}>
                    <pc.StereolinkMode
                      onChange={onChange}
                      value={setup.stereolinkMode}
                      includeLabel
                    />
                  </Col>
                </Row>
              </Panel>
            </BlockUi>
          </Tab>
          <Tab title="Outputs" eventKey="ouputs">
            <BlockUi blocking={blocking}>
              <Panel>
                <Row>
                  <Col xs={12} sm={4}>
                    <pc.MuteOutsWhenPowered
                      onChange={onChange}
                      value={setup.muteOutsWhenPowered}
                      includeLabel
                    />
                  </Col>
                  <Col xs={12} sm={4}>
                    <pc.OutputConfig
                      onChange={onChange}
                      value={setup.outputConfig}
                      includeLabel
                    />
                  </Col>

                  <Col xs={12} sm={4}>
                    <pc.CrossoverLink
                      onChange={onChange}
                      value={setup.crossoverLink}
                      includeLabel
                    />
                  </Col>
                </Row>
              </Panel>
              <OutputSources
                onChange={onChange}
                group="outputs"
                channels={outputs}
                xs={12}
                sm={6}
                md={4}
              />
              <ChannelNames
                onChange={onChange}
                group="outputs"
                channels={outputs}
                xs={12}
                sm={6}
                md={4}
              />
            </BlockUi>
          </Tab>
          <Tab title="Sum" eventKey="sum">
            <BlockUi blocking={blocking}>
              <Panel>
                <pc.InputSumType
                  onChange={onChange}
                  value={setup.inputSumType}
                  includeLabel
                />
                <pc.InputASumGain
                  onChange={onChange}
                  value={setup.inputASumGain}
                  includeLabel
                />
                <pc.InputBSumGain
                  onChange={onChange}
                  value={setup.inputBSumGain}
                  includeLabel
                />
                <pc.InputCSumGain
                  onChange={onChange}
                  value={setup.inputCSumGain}
                  includeLabel
                />
              </Panel>
            </BlockUi>
          </Tab>
          <Tab title="Delay Config" eventKey="delaySetup">
            <BlockUi blocking={blocking}>
              <Panel>
                <Row>
                  <Col xs={6}>
                    <pc.DelayLink
                      onChange={onChange}
                      value={setup.delayLink}
                      includeLabel
                    />
                  </Col>
                  <Col xs={6}>
                    <pc.DelayCorrection
                      onChange={onChange}
                      value={delayCorrection}
                      includeLabel
                    />
                  </Col>
                </Row>
                <pc.AirTemperature
                  onChange={onChange}
                  value={airTemperature}
                  includeLabel
                />
                <pc.DelayUnits
                  onChange={onChange}
                  value={delayUnits}
                  includeLabel
                />
              </Panel>
            </BlockUi>
          </Tab>
        </Tabs>
      </div>
    );
  }
}

export default Setup;
