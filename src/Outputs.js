import React, {Component} from 'react';
import {Panel, Tabs, Tab} from 'react-bootstrap';
import BlockUi from 'react-block-ui';
import isEqual from 'lodash.isequal';
import DynamicEQs from './DynamicEQs';
import Delays from './Delays';
import EQs from './EQs';
import Crossovers from './Crossovers';
import Limiters from './Limiters';
import Phases from './Phases';
import CrossoverPlot from './plots/CrossoverPlot';
import EQPlot from './plots/EQPlot';

class Outputs extends Component {
  shouldComponentUpdate(nextProps) {
    const {blocking, channels, setup} = this.props;
    return !(
      blocking === nextProps.blocking &&
      isEqual(channels, nextProps.channels) &&
      isEqual(setup, nextProps.setup)
    );
  }

  render() {
    const {channels, onChange, blocking} = this.props;
    return (
      <div>
        <h2>
Output Channels
        </h2>
        <hr/>
        <Tabs defaultActiveKey="eqs" id="input-eqs" animation={false}>
          <br/>
          <Tab title="EQ" bsStyle="primary" eventKey="eqs">
            <Panel
              bsSize="small"
              header="Frequency Response"
              className="hidden-xs"
            >
              <EQPlot channels={channels}/>
            </Panel>
            <BlockUi blocking={blocking}>
              <EQs
                onChange={onChange}
                group="outputs"
                channels={channels}
                xs={12}
                sm={12}
                md={6}
              />
            </BlockUi>
          </Tab>
          <Tab title="Dynamic EQ" bsStyle="primary" eventKey="dynamicEQs">
            <BlockUi blocking={blocking}>
              <DynamicEQs
                onChange={onChange}
                group="outputs"
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
                group="outputs"
                channels={channels}
                xs={12}
              />
            </BlockUi>
          </Tab>
          <Tab title="Crossover" bsStyle="primary" eventKey="crossover">
            <Panel
              bsSize="small"
              header="Frequency Response"
              className="hidden-xs"
            >
              <CrossoverPlot channels={channels}/>
            </Panel>
            <BlockUi blocking={blocking}>
              <Crossovers
                onChange={onChange}
                group="outputs"
                channels={channels}
              />
            </BlockUi>
          </Tab>
          <Tab title="Limiter" bsStyle="primary" eventKey="limiters">
            <BlockUi blocking={blocking}>
              <Limiters
                onChange={onChange}
                group="outputs"
                channels={channels}
              />
            </BlockUi>
          </Tab>
          <Tab title="Phase" bsStyle="primary" eventKey="phases">
            <BlockUi blocking={blocking}>
              <Phases
                onChange={onChange}
                group="outputs"
                channels={channels}
                xs={12}
                sm={6}
                md={4}
              />
            </BlockUi>
          </Tab>
        </Tabs>
      </div>
    );
  }
}

export default Outputs;
