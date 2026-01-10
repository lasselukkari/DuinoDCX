import React from 'react';
import Card from 'react-bootstrap/Card';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useNavigate, useParams } from '@tanstack/react-router';
import type { State } from 'dcx-parser';
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

type Props = {
  readonly device: State;
  readonly isBlocking: boolean;
};

function Outputs({ device, isBlocking }: Props) {
  const { outputs: channels, setup } = device;
  const navigate = useNavigate();
  const { tab = 'gain' } = useParams({ strict: false }) as any;

  const handleSelect = (key: string | null) => {
    if (key) {
      void navigate({ to: '/outputs/$tab', params: { tab: key } });
    }
  };

  return (
    <div>
      <Tabs
        unmountOnExit
        activeKey={tab}
        onSelect={handleSelect}
        variant="pills"
        id="outputs"
        className="control-menu"
      >
        <Tab title="Gain" eventKey="gain">
          <Card>
            <Card.Header>Gain</Card.Header>
            <Card.Body>
              <BlockUi isBlocking={isBlocking}>
                <Gains group="outputs" channels={channels} />
              </BlockUi>
            </Card.Body>
          </Card>
        </Tab>
        <Tab title="Crossover" eventKey="crossover">
          <CrossoverPlotPanel channels={channels} />
          <BlockUi isBlocking={isBlocking}>
            <Crossovers channels={channels} />
          </BlockUi>
        </Tab>
        <Tab title="Equalizer" eventKey="equalizers">
          <EqualizerPlotPanel channels={channels} group="outputs" />
          <Equalizers
            isBlocking={isBlocking}
            group="outputs"
            channels={channels}
          />
        </Tab>
        <Tab eventKey="dynamicEqualizers" title="Dynamic Equalizer">
          <BlockUi isBlocking={isBlocking}>
            <DynamicEqualizers group="outputs" channels={channels} />
          </BlockUi>
        </Tab>

        <Tab title="Limiter" eventKey="limiters">
          <BlockUi isBlocking={isBlocking}>
            <Limiters channels={channels} />
          </BlockUi>
        </Tab>
        <Tab title="Phase" eventKey="phases">
          <BlockUi isBlocking={isBlocking}>
            <Phases channels={channels} />
          </BlockUi>
        </Tab>
        <Tab title="Delay" eventKey="delays">
          <BlockUi isBlocking={isBlocking}>
            <Delays group="outputs" channels={channels} setup={setup} />
          </BlockUi>
        </Tab>
        <Tab title="Routing" eventKey="routing">
          <BlockUi isBlocking={isBlocking}>
            <OutputRouting setup={setup} outputs={channels} />
          </BlockUi>
        </Tab>
      </Tabs>
    </div>
  );
}

export default React.memo(Outputs, (previousProps, nextProps) => {
  return (
    previousProps.isBlocking === nextProps.isBlocking &&
    previousProps.device === nextProps.device
  );
});
