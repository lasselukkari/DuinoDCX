import React, {Component} from 'react';
import {Panel, Tabs, Tab} from 'react-bootstrap';
import BlockUi from 'react-block-ui';
import isEqual from 'lodash.isequal';

import EQPlot from './plots/EQPlot';
import DynamicEQs from './DynamicEQs';
import Delays from './Delays';
import EQs from './EQs';

class Inputs extends Component {
  shouldComponentUpdate(nextProps) {
    const {blocking, channels, setup} = this.props;
    return !(
      nextProps.blocking === blocking &&
      isEqual(nextProps.channels, channels) &&
      isEqual(nextProps.setup, setup)
    );
  }

  render() {
    const {channels, onChange, blocking} = this.props;
    return (
      <div>
        <h2>
Input Channels
        </h2>
        <hr/>
        <Tabs defaultActiveKey="eq" id="inputs" animation={false}>
          <br/>
          <Tab title="EQ" bsStyle="primary" eventKey="eq">
            <Panel
              bsSize="small"
              header="Frequency Response"
            >
              <EQPlot channels={channels}/>
            </Panel>
            <EQs
              onChange={onChange}
              group="inputs"
              channels={channels}
              blocking={blocking}
              xs={12}
              sm={12}
              md={6}
            />
          </Tab>
          <Tab title="Dynamic EQ" bsStyle="primary" eventKey="dynamicEQ">
            <BlockUi blocking={blocking}>
              <DynamicEQs
                onChange={onChange}
                group="inputs"
                channels={channels}
                xs={12}
                sm={12}
                md={6}
              />
            </BlockUi>
          </Tab>
          <Tab title="Delay" bsStyle="primary" eventKey="delays">
            <BlockUi blocking={blocking}>
              <Delays
                onChange={onChange}
                group="inputs"
                channels={channels}
                xs={12}
              />
            </BlockUi>
          </Tab>
        </Tabs>
      </div>
    );
  }
}

export default Inputs;
