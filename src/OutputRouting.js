import React, {Component} from 'react';
import {Panel, Row, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import pc from './parameters';
import OutputSources from './OutputSources';
import ChannelNames from './ChannelNames';

class OutputRouting extends Component {
  shouldComponentUpdate(nextProps) {
    const {outputs, setup} = this.props;
    return !(
      isEqual(outputs, nextProps.outputs) && isEqual(setup, nextProps.setup)
    );
  }

  render() {
    const {setup, onChange, outputs} = this.props;
    const {
      stereolink,
      muteOutsWhenPowered,
      outputConfig,
      crossoverLink
    } = setup;

    return (
      <div>
        <Panel>
          <Panel.Heading>Link Setup</Panel.Heading>
          <Panel.Body>
            <Row>
              <Col xs={12} sm={4}>
                <pc.OutputConfig
                  includeLabel
                  value={outputConfig}
                  onChange={onChange}
                />
              </Col>
              <Col xs={12} sm={4}>
                <pc.Stereolink
                  includeLabel
                  value={stereolink}
                  onChange={onChange}
                />
              </Col>
              <Col xs={12} sm={4}>
                <pc.CrossoverLink
                  includeLabel
                  value={crossoverLink}
                  onChange={onChange}
                />
              </Col>
            </Row>
          </Panel.Body>
        </Panel>

        <OutputSources group="outputs" channels={outputs} onChange={onChange} />
        <ChannelNames group="outputs" channels={outputs} onChange={onChange} />
        <Panel>
          <Panel.Heading>Mute Outs When Powered</Panel.Heading>
          <Panel.Body>
            <pc.MuteOutsWhenPowered
              value={muteOutsWhenPowered}
              onChange={onChange}
            />
          </Panel.Body>
        </Panel>
      </div>
    );
  }
}

export default OutputRouting;
