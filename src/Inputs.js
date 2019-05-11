import React, {Component} from 'react';
import {Panel, Tabs, Tab} from 'react-bootstrap';
import BlockUi from 'react-block-ui';
import isEqual from 'lodash.isequal';

import Gains from './Gains';
import EQPlotPanel from './EQPlotPanel';
import DynamicEQs from './DynamicEQs';
import Delays from './Delays';
import EQs from './EQs';
import InputRouting from './InputRouting';

class Inputs extends Component {
  shouldComponentUpdate(nextProps) {
    const {blocking, channels, setup} = this.props;

    return !(
      blocking === nextProps.blocking &&
      isEqual(channels, nextProps.channels) &&
      isEqual(setup, nextProps.setup)
    );
  }

  render() {
    const {channels, setup, onChange, blocking} = this.props;
    return (
      <div>
        <Tabs defaultActiveKey="gain" id="inputs" animation={false}>
          <Tab title="Gain" bsStyle="primary" eventKey="gain">
            <Panel>
              <Panel.Heading>Gain</Panel.Heading>
              <Panel.Body>
                <BlockUi blocking={blocking}>
                  <Gains
                    group="inputs"
                    channels={channels}
                    onChange={onChange}
                  />
                </BlockUi>
              </Panel.Body>
            </Panel>
          </Tab>
          <Tab title="EQ" bsStyle="primary" eventKey="eq">
            <EQPlotPanel channels={channels} group="inputs" />
            <EQs
              group="inputs"
              channels={channels}
              blocking={blocking}
              onChange={onChange}
            />
          </Tab>
          <Tab title="Dynamic EQ" bsStyle="primary" eventKey="dynamicEQ">
            <BlockUi blocking={blocking}>
              <DynamicEQs
                group="inputs"
                channels={channels}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="Delay" bsStyle="primary" eventKey="delays">
            <BlockUi blocking={blocking}>
              <Delays
                group="inputs"
                channels={channels}
                setup={setup}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>

          <Tab title="Routing" bsStyle="primary" eventKey="routing">
            <BlockUi blocking={blocking}>
              <InputRouting setup={setup} onChange={onChange} />
            </BlockUi>
          </Tab>
        </Tabs>
      </div>
    );
  }
}

export default Inputs;
