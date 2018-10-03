import React, {Component} from 'react';
import {Tabs, Tab} from 'react-bootstrap';
import BlockUi from 'react-block-ui';
import isEqual from 'lodash.isequal';

import EQPlotPanel from './EQPlotPanel';
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
    const {channels, setup, onChange, blocking} = this.props;
    return (
      <div>
        <h2>Input Channels</h2>
        <hr />
        <Tabs defaultActiveKey="eq" id="inputs" animation={false}>
          <br />
          <Tab title="EQ" bsStyle="primary" eventKey="eq">
            <EQPlotPanel channels={channels} />
            <EQs
              group="inputs"
              channels={channels}
              blocking={blocking}
              xs={12}
              sm={12}
              md={6}
              onChange={onChange}
            />
          </Tab>
          <Tab title="Dynamic EQ" bsStyle="primary" eventKey="dynamicEQ">
            <BlockUi blocking={blocking}>
              <DynamicEQs
                group="inputs"
                channels={channels}
                xs={12}
                sm={12}
                md={6}
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
                xs={12}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
        </Tabs>
      </div>
    );
  }
}

export default Inputs;
