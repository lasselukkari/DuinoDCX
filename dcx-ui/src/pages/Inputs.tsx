import React from 'react';
import Card from 'react-bootstrap/Card';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import {useNavigate, useParams, useRouter} from '@tanstack/react-router';
import type {State} from 'dcx-parser';
import BlockUi from '@/components/BlockUi.tsx';
import Delays from '@/components/Delays.tsx';
import Equalizers from '@/components/Equalizers.tsx';
import EqualizerPlotPanel from '@/components/EqualizerPlotPanel.tsx';
import DynamicEqualizers from '@/components/DynamicEqualizers.tsx';
import Gains from '@/components/Gains.tsx';
import InputRouting from '@/components/InputRouting.tsx';

type Props = {
  readonly device: State;
  readonly isBlocking: boolean;
};

function Inputs({device, isBlocking}: Props) {
  const {inputs: channels, setup} = device;
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
          to: '/inputs/equalizers/$channelId',
          params: {channelId: 'A'},
        });
      } else if (key === 'dynamic-equalizers') {
        void navigate({to: '/inputs/dynamic-equalizers'});
      } else {
        void navigate({to: '/inputs/$tab', params: {tab: key}});
      }
    }
  };

  return (
    <div>
      <Tabs
        unmountOnExit
        activeKey={activeTab}
        variant="pills"
        id="inputs"
        className="control-menu"
        onSelect={handleSelect}
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
        <Tab title="Equalizer" eventKey="equalizers">
          <EqualizerPlotPanel channels={channels} group="inputs" />
          <BlockUi isBlocking={isBlocking}>
            <Equalizers
              group="inputs"
              channels={channels}
              isBlocking={isBlocking}
            />
          </BlockUi>
        </Tab>
        <Tab eventKey="dynamic-equalizers" title="Dynamic Equalizer">
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
  return (
    previousProps.isBlocking === nextProps.isBlocking &&
    previousProps.device === nextProps.device
  );
});
