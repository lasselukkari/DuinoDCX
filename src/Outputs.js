import React, {Component} from 'react';
import {Tabs, Tab} from 'react-bootstrap';
import BlockUi from 'react-block-ui';
import isEqual from 'lodash.isequal';
import DynamicEQs from './DynamicEQs';
import Delays from './Delays';
import EQs from './EQs';
import Crossovers from './Crossovers';
import Limiters from './Limiters';
import Phases from './Phases';
import CrossoverPlotPanel from './CrossoverPlotPanel';
import EQPlotPanel from './EQPlotPanel';

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
    const {channels, setup, onChange, blocking} = this.props;
    return (
      <div>
        <h2>Output Channels</h2>
        <hr />
        <Tabs defaultActiveKey="crossover" id="outputs" animation={false}>
          <br />
          <Tab title="Crossover" bsStyle="primary" eventKey="crossover">
            <CrossoverPlotPanel channels={channels} />
            <BlockUi blocking={blocking}>
              <Crossovers
                group="outputs"
                channels={channels}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="EQ" bsStyle="primary" eventKey="eqs">
            <EQPlotPanel channels={channels} />
            <EQs
              blocking={blocking}
              group="outputs"
              channels={channels}
              xs={12}
              sm={12}
              md={6}
              onChange={onChange}
            />
          </Tab>
          <Tab title="Dynamic EQ" bsStyle="primary" eventKey="dynamicEQs">
            <BlockUi blocking={blocking}>
              <DynamicEQs
                group="outputs"
                channels={channels}
                xs={12}
                sm={12}
                md={6}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="Limiter" bsStyle="primary" eventKey="limiters">
            <BlockUi blocking={blocking}>
              <Limiters
                group="outputs"
                channels={channels}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="Phase" bsStyle="primary" eventKey="phases">
            <BlockUi blocking={blocking}>
              <Phases
                group="outputs"
                channels={channels}
                xs={12}
                sm={6}
                md={4}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="Delay" bsStyle="primary" eventKey="delays">
            <BlockUi blocking={blocking}>
              <Delays
                group="outputs"
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

export default Outputs;
