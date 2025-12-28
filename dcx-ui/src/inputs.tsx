import React from 'react';
import Card from 'react-bootstrap/Card';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import BlockUi from './components/block-ui.tsx';
import Delays from './delays.tsx';
import Equalizers from './equalizers.tsx';
import EqualizerPlotPanel from './equalizer-plot-panel.tsx';
import DynamicEqualizers from './dynamic-equalizers.tsx';
import Gains from './gains.tsx';
import InputRouting from './input-routing.tsx';
import {useDeviceState} from './device-state-context.tsx';

type Props = {
  readonly isBlocking: boolean;
};

function Inputs({isBlocking}: Props) {
  const {device} = useDeviceState();

  if (!device) return null;

  const {inputs: channels, setup} = device;

  return (
    <div>
      <Tabs
        unmountOnExit
        defaultActiveKey="gain"
        variant="pills"
        id="inputs"
        className="control-menu"
      >
        <Tab title="Gain" eventKey="gain">
          <Card>
            <Card.Header>Gain</Card.Header>
            <Card.Body>
              <BlockUi isBlocking={isBlocking}>
                <Gains group="inputs" channels={channels} />
              </BlockUi>
            </Card.Body>
          </Card>
        </Tab>
        <Tab title="EQ" eventKey="eq">
          <EqualizerPlotPanel channels={channels} group="inputs" />
          <BlockUi isBlocking={isBlocking}>
            <Equalizers
              group="inputs"
              channels={channels}
              isBlocking={isBlocking}
            />
          </BlockUi>
        </Tab>
        <Tab eventKey="dynamicEqualizers" title="Dynamic EQ">
          <BlockUi isBlocking={isBlocking}>
            <DynamicEqualizers group="inputs" channels={channels} />
          </BlockUi>
        </Tab>
        <Tab title="Delay" eventKey="delays">
          <BlockUi isBlocking={isBlocking}>
            <Delays group="inputs" channels={channels} setup={setup} />
          </BlockUi>
        </Tab>

        <Tab title="Routing" eventKey="routing">
          <BlockUi isBlocking={isBlocking}>
            <InputRouting setup={setup} />
          </BlockUi>
        </Tab>
      </Tabs>
    </div>
  );
}

export default React.memo(Inputs, (previousProps, nextProps) => {
  return previousProps.isBlocking === nextProps.isBlocking;
});
