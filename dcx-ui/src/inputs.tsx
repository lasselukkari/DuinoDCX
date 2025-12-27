import React from 'react';
import BlockUi from 'react-block-ui';
import Card from 'react-bootstrap/Card';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import isEqual from 'lodash.isequal';
import Delays from './delays.tsx';
import DynamicEQs from './dynamic-e-qs.tsx';
import EqPlotPanel from './e-q-plot-panel.tsx';
import Eqs from './e-qs.tsx';
import Gains from './gains.tsx';
import InputRouting from './input-routing.tsx';
import {type Channel} from './dcx2496/parser.ts';

type ChangeEventArgs = {
  param?: string;
  group?: string;
  channelId?: string;
  value?: boolean | number | string;
};

type Props = {
  readonly isBlocking: boolean;
  readonly channels: Record<string, Channel>;
  readonly setup: Record<string, unknown>;
  readonly onChange: (args: ChangeEventArgs | ChangeEventArgs[]) => void;
};

function Inputs({channels, setup, onChange, isBlocking}: Props) {
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
              {/* @ts-ignore: BlockUi might lack types */}
              <BlockUi blocking={isBlocking}>
                <Gains group="inputs" channels={channels} onChange={onChange} />
              </BlockUi>
            </Card.Body>
          </Card>
        </Tab>
        <Tab title="EQ" eventKey="eq">
          <EqPlotPanel channels={channels} group="inputs" />
          <Eqs
            group="inputs"
            channels={channels}
            isBlocking={isBlocking}
            onChange={onChange}
          />
        </Tab>
        <Tab title="Dynamic EQ" eventKey="dynamicEQ">
          {/* @ts-ignore */}
          <BlockUi blocking={isBlocking}>
            <DynamicEQs
              group="inputs"
              channels={channels}
              onChange={onChange}
            />
          </BlockUi>
        </Tab>
        <Tab title="Delay" eventKey="delays">
          {/* @ts-ignore */}
          <BlockUi blocking={isBlocking}>
            <Delays
              group="inputs"
              channels={channels}
              setup={setup}
              onChange={onChange}
            />
          </BlockUi>
        </Tab>

        <Tab title="Routing" eventKey="routing">
          {/* @ts-ignore */}
          <BlockUi blocking={isBlocking}>
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
