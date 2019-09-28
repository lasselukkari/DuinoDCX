import React, {Component} from 'react';
import BlockUi from 'react-block-ui';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import isEqual from 'lodash.isequal';
import CrossoverPlotPanel from './CrossoverPlotPanel';
import Crossovers from './Crossovers';
import Delays from './Delays';
import DynamicEQs from './DynamicEQs';
import EQPlotPanel from './EQPlotPanel';
import EQs from './EQs';
import Gains from './Gains';
import Limiters from './Limiters';
import OutputRouting from './OutputRouting';
import Phases from './Phases';

class Outputs extends Component {
  static propTypes = {
    blocking: PropTypes.bool.isRequired,
    channels: PropTypes.object.isRequired,
    setup: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

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
        <Tabs
          defaultActiveKey="gain"
          variant="pills"
          id="outputs"
          className="control-menu"
        >
          <Tab title="Gain" variant="primary" eventKey="gain">
            <Card>
              <Card.Header>Gain</Card.Header>
              <Card.Body>
                <BlockUi blocking={blocking}>
                  <Gains
                    group="outputs"
                    channels={channels}
                    onChange={onChange}
                  />
                </BlockUi>
              </Card.Body>
            </Card>
          </Tab>
          <Tab title="Crossover" variant="primary" eventKey="crossover">
            <CrossoverPlotPanel channels={channels} />
            <BlockUi blocking={blocking}>
              <Crossovers
                group="outputs"
                channels={channels}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="EQ" variant="primary" eventKey="eqs">
            <EQPlotPanel channels={channels} group="outputs" />
            <EQs
              blocking={blocking}
              group="outputs"
              channels={channels}
              onChange={onChange}
            />
          </Tab>
          <Tab title="Dynamic EQ" variant="primary" eventKey="dynamicEQs">
            <BlockUi blocking={blocking}>
              <DynamicEQs
                group="outputs"
                channels={channels}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="Limiter" variant="primary" eventKey="limiters">
            <BlockUi blocking={blocking}>
              <Limiters
                group="outputs"
                channels={channels}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="Phase" variant="primary" eventKey="phases">
            <BlockUi blocking={blocking}>
              <Phases group="outputs" channels={channels} onChange={onChange} />
            </BlockUi>
          </Tab>
          <Tab title="Delay" variant="primary" eventKey="delays">
            <BlockUi blocking={blocking}>
              <Delays
                group="outputs"
                channels={channels}
                setup={setup}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="Routing" variant="primary" eventKey="routing">
            <BlockUi blocking={blocking}>
              <OutputRouting
                setup={setup}
                outputs={channels}
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
