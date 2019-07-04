import React, {Component} from 'react';
import {Card, Tabs, Tab} from 'react-bootstrap';
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
        <Tabs defaultActiveKey="gain" id="inputs">
          <Tab title="Gain" variant="primary" eventKey="gain">
            <Card>
              <Card.Header>Gain</Card.Header>
              <Card.Body>
                <BlockUi blocking={blocking}>
                  <Gains
                    group="inputs"
                    channels={channels}
                    onChange={onChange}
                  />
                </BlockUi>
              </Card.Body>
            </Card>
          </Tab>
          <Tab title="EQ" variant="primary" eventKey="eq">
            <EQPlotPanel channels={channels} group="inputs" />
            <EQs
              group="inputs"
              channels={channels}
              blocking={blocking}
              onChange={onChange}
            />
          </Tab>
          <Tab title="Dynamic EQ" variant="primary" eventKey="dynamicEQ">
            <BlockUi blocking={blocking}>
              <DynamicEQs
                group="inputs"
                channels={channels}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="Delay" variant="primary" eventKey="delays">
            <BlockUi blocking={blocking}>
              <Delays
                group="inputs"
                channels={channels}
                setup={setup}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>

          <Tab title="Routing" variant="primary" eventKey="routing">
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
