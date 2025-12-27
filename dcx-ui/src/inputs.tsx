import React from 'react';
import Card from 'react-bootstrap/Card';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import isEqual from 'lodash.isequal';
import BlockUi from './components/block-ui.tsx';
import Delays from './delays.tsx';
import Equalizers from './equalizers.tsx';
import EqualizerPlotPanel from './equalizer-plot-panel.tsx';
import DynamicEqualizers from './dynamic-equalizers.tsx';
import Gains from './gains.tsx';
import InputRouting from './input-routing.tsx';
import { type Channel, type Setup } from './dcx2496/parser.ts';

type ChangeEventArgs = {
  param?: string;
  group?: string;
  channelId?: string;
  value?: boolean | number | string;
};

type Props = {
  readonly isBlocking: boolean;
  readonly channels: Record<string, Channel>;
  readonly setup: Setup;
  readonly onChange: (args: ChangeEventArgs | ChangeEventArgs[]) => void;
};

function Inputs({ channels, setup, onChange, isBlocking }: Props) {
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
                <Gains group="inputs" channels={channels} onChange={onChange} />
              </BlockUi>
            </Card.Body>
          </Card>
        </Tab>
        <Tab title="EQ" eventKey="eq">
          <BlockUi isBlocking={isBlocking}>
            <Equalizers
              group="inputs"
              channels={channels}
              isBlocking={isBlocking}
              onChange={onChange}
            />
          </BlockUi>
        </Tab>
        <Tab eventKey="dynamicEqualizers" title="Dynamic EQ">
          <BlockUi isBlocking={isBlocking}>
            <DynamicEqualizers
              group="inputs"
              channels={channels}
              onChange={onChange}
            />
          </BlockUi>
        </Tab>
        <Tab eventKey="equalizerPlots" title="EQ Plot">
          <EqualizerPlotPanel channels={channels} group="inputs" />
        </Tab>
        <Tab title="Delay" eventKey="delays">
          <BlockUi isBlocking={isBlocking}>
            <Delays
              group="inputs"
              channels={channels}
              setup={setup}
              onChange={onChange}
            />
          </BlockUi>
        </Tab>

        <Tab title="Routing" eventKey="routing">
          <BlockUi isBlocking={isBlocking}>
            <InputRouting setup={setup} onChange={onChange} />
          </BlockUi>
        </Tab>
      </Tabs>
    </div>
  );
}

export default React.memo(Inputs, (previousProps, nextProps) => {
  return (
    previousProps.isBlocking === nextProps.isBlocking &&
    isEqual(previousProps.channels, nextProps.channels) &&
    isEqual(previousProps.setup, nextProps.setup)
  );
});
