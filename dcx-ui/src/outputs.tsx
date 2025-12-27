import React from 'react';
import BlockUi from 'react-block-ui';
import Card from 'react-bootstrap/Card';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import isEqual from 'lodash.isequal';
import CrossoverPlotPanel from './crossover-plot-panel.tsx';
import Crossovers from './crossovers.tsx';
import Delays from './delays.tsx';
import DynamicEQs from './dynamic-e-qs.tsx';
import EqPlotPanel from './e-q-plot-panel.tsx';
import Eqs from './e-qs.tsx';
import Gains from './gains.tsx';
import Limiters from './limiters.tsx';
import OutputRouting from './output-routing.tsx';
import Phases from './phases.tsx';
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

function Outputs({channels, setup, onChange, isBlocking}: Props) {
  return (
    <div>
      <Tabs
        unmountOnExit
        defaultActiveKey="gain"
        variant="pills"
        id="outputs"
        className="control-menu"
      >
        <Tab title="Gain" eventKey="gain">
          <Card>
            <Card.Header>Gain</Card.Header>
            <Card.Body>
              {/* @ts-ignore */}
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
        <Tab title="Crossover" eventKey="crossover">
          <CrossoverPlotPanel channels={channels} />
          {/* @ts-ignore */}
          <BlockUi blocking={isBlocking}>
            <Crossovers
              group="outputs"
              channels={channels}
              onChange={onChange}
            />
          </BlockUi>
        </Tab>
        <Tab title="EQ" eventKey="eqs">
          <EqPlotPanel channels={channels} group="outputs" />
          <Eqs
            isBlocking={isBlocking}
            group="outputs"
            channels={channels}
            onChange={onChange}
          />
        </Tab>
        <Tab title="Dynamic EQ" eventKey="dynamicEQs">
          {/* @ts-ignore */}
          <BlockUi blocking={isBlocking}>
            <DynamicEQs
              group="outputs"
              channels={channels}
              onChange={onChange}
            />
          </BlockUi>
        </Tab>
        <Tab title="Limiter" eventKey="limiters">
          {/* @ts-ignore */}
          <BlockUi blocking={isBlocking}>
            <Limiters group="outputs" channels={channels} onChange={onChange} />
          </BlockUi>
        </Tab>
        <Tab title="Phase" eventKey="phases">
          {/* @ts-ignore */}
          <BlockUi blocking={isBlocking}>
            <Phases group="outputs" channels={channels} onChange={onChange} />
          </BlockUi>
        </Tab>
        <Tab title="Delay" eventKey="delays">
          {/* @ts-ignore */}
          <BlockUi blocking={isBlocking}>
            <Delays
              group="outputs"
              channels={channels}
              setup={setup}
              onChange={onChange}
            />
          </BlockUi>
        </Tab>
        <Tab title="Routing" eventKey="routing">
          {/* @ts-ignore */}
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

export default React.memo(Outputs, (previousProps, nextProps) => {
  return (
    previousProps.isBlocking === nextProps.isBlocking &&
    isEqual(previousProps.channels, nextProps.channels) &&
    isEqual(previousProps.setup, nextProps.setup)
  );
});
