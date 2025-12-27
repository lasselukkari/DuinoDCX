import React from 'react';
import Card from 'react-bootstrap/Card';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import isEqual from 'lodash.isequal';
import BlockUi from './components/block-ui.tsx';
import CrossoverPlotPanel from './crossover-plot-panel.tsx';
import Crossovers from './crossovers.tsx';
import Delays from './delays.tsx';
import Equalizers from './equalizers.tsx';
import EqualizerPlotPanel from './equalizer-plot-panel.tsx';
import DynamicEqualizers from './dynamic-equalizers.tsx';
import Gains from './gains.tsx';
import Limiters from './limiters.tsx';
import OutputRouting from './output-routing.tsx';
import Phases from './phases.tsx';
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

function Outputs({ channels, setup, onChange, isBlocking }: Props) {
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
              <BlockUi isBlocking={isBlocking}>
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
          <BlockUi isBlocking={isBlocking}>
            <Crossovers
              group="outputs"
              channels={channels}
              onChange={onChange}
            />
          </BlockUi>
        </Tab>
        <Tab title="EQ" eventKey="eqs">
          <EqualizerPlotPanel channels={channels} group="outputs" />
          <Equalizers
            isBlocking={isBlocking}
            group="outputs"
            channels={channels}
            onChange={onChange}
          />
        </Tab>
        <Tab eventKey="dynamicEqualizers" title="Dynamic EQ">
          <BlockUi isBlocking={isBlocking}>
            <DynamicEqualizers
              group="outputs"
              channels={channels}
              onChange={onChange}
            />
          </BlockUi>
        </Tab>
        <Tab eventKey="equalizerPlots" title="EQ Plot">
          <EqualizerPlotPanel channels={channels} group="outputs" />
        </Tab>
        <Tab title="Limiter" eventKey="limiters">
          <BlockUi isBlocking={isBlocking}>
            <Limiters group="outputs" channels={channels} onChange={onChange} />
          </BlockUi>
        </Tab>
        <Tab title="Phase" eventKey="phases">
          <BlockUi isBlocking={isBlocking}>
            <Phases group="outputs" channels={channels} onChange={onChange} />
          </BlockUi>
        </Tab>
        <Tab title="Delay" eventKey="delays">
          <BlockUi isBlocking={isBlocking}>
            <Delays
              group="outputs"
              channels={channels}
              setup={setup}
              onChange={onChange}
            />
          </BlockUi>
        </Tab>
        <Tab title="Routing" eventKey="routing">
          <BlockUi isBlocking={isBlocking}>
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
