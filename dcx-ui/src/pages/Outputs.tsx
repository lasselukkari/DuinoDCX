import React from 'react';
import Card from 'react-bootstrap/Card';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import {useNavigate, useParams, useRouter} from '@tanstack/react-router';
import type {State} from 'dcx-parser';
import BlockUi from '@/components/BlockUi.tsx';
import CrossoverPlotPanel from '@/components/CrossoverPlotPanel.tsx';
import Crossovers from '@/components/Crossovers.tsx';
import Delays from '@/components/Delays.tsx';
import Equalizers from '@/components/Equalizers.tsx';
import EqualizerPlotPanel from '@/components/EqualizerPlotPanel.tsx';
import DynamicEqualizers from '@/components/DynamicEqualizers.tsx';
import Gains from '@/components/Gains.tsx';
import Limiters from '@/components/Limiters.tsx';
import OutputRouting from '@/components/OutputRouting.tsx';
import Phases from '@/components/Phases.tsx';

type Props = {
  readonly device: State;
  readonly isBlocking: boolean;
};

function Outputs({device, isBlocking}: Props) {
  const {outputs: channels, setup} = device;
  const navigate = useNavigate();
  const router = useRouter();
  const parameters = useParams({strict: false});

  let activeTab = parameters.tab ?? 'gain';
  const {pathname} = router.state.location;

  if (pathname.includes('/dynamic-equalizers')) {
    activeTab = 'dynamic-equalizers';
  } else if (pathname.includes('/equalizers')) {
    activeTab = 'equalizers';
  }

  // eslint-disable-next-line @typescript-eslint/no-restricted-types
  const handleSelect = (key: string | null) => {
    if (key) {
      if (key === 'equalizers') {
        void navigate({
          to: '/outputs/equalizers/$channelId',
          params: {channelId: '1'},
        });
      } else if (key === 'dynamic-equalizers') {
        void navigate({to: '/outputs/dynamic-equalizers'});
      } else {
        void navigate({to: '/outputs/$tab', params: {tab: key}});
      }
    }
  };

  return (
    <div>
      <Tabs
        unmountOnExit
        activeKey={activeTab}
        variant="pills"
        id="outputs"
        className="control-menu"
        onSelect={handleSelect}
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
        <Tab eventKey="dynamic-equalizers" title="Dynamic Equalizer">
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
