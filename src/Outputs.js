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
    isBlocking: PropTypes.bool.isRequired,
    channels: PropTypes.object.isRequired,
    setup: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  shouldComponentUpdate(nextProps) {
    const {isBlocking, channels, setup} = this.props;
    return !(
      isBlocking === nextProps.isBlocking &&
      isEqual(channels, nextProps.channels) &&
      isEqual(setup, nextProps.setup)
    );
  }

  render() {
    const {channels, setup, onChange, isBlocking} = this.props;
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
                <BlockUi blocking={isBlocking}>
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
            <BlockUi blocking={isBlocking}>
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
              isBlocking={isBlocking}
              group="outputs"
              channels={channels}
              onChange={onChange}
            />
          </Tab>
          <Tab title="Dynamic EQ" variant="primary" eventKey="dynamicEQs">
            <BlockUi blocking={isBlocking}>
              <DynamicEQs
                group="outputs"
                channels={channels}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="Limiter" variant="primary" eventKey="limiters">
            <BlockUi blocking={isBlocking}>
              <Limiters
                group="outputs"
                channels={channels}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="Phase" variant="primary" eventKey="phases">
            <BlockUi blocking={isBlocking}>
              <Phases group="outputs" channels={channels} onChange={onChange} />
            </BlockUi>
          </Tab>
          <Tab title="Delay" variant="primary" eventKey="delays">
            <BlockUi blocking={isBlocking}>
              <Delays
                group="outputs"
                channels={channels}
                setup={setup}
                onChange={onChange}
              />
            </BlockUi>
          </Tab>
          <Tab title="Routing" variant="primary" eventKey="routing">
            <BlockUi blocking={isBlocking}>
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
