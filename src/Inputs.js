import React, {Component} from 'react';
import BlockUi from 'react-block-ui';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import isEqual from 'lodash.isequal';
import Delays from './Delays';
import DynamicEQs from './DynamicEQs';
import EQPlotPanel from './EQPlotPanel';
import EQs from './EQs';
import Gains from './Gains';
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
        <Tabs
          defaultActiveKey="gain"
          variant="pills"
          id="inputs"
          className="control-menu"
        >
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

Inputs.propTypes = {
  blocking: PropTypes.bool.isRequired,
  channels: PropTypes.object.isRequired,
  setup: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default Inputs;
