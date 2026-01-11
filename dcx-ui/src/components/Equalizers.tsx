import React from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import {useNavigate, useParams} from '@tanstack/react-router';
import {type Channel, isOutputChannel} from 'dcx-parser';
import EqualizerList from '@/components/EqualizerList.tsx';

type Props = {
  readonly isBlocking: boolean;
  readonly group: 'inputs' | 'outputs';
  readonly channels: Record<string, Channel>;
};

function Equalizers({channels, group, isBlocking}: Props) {
  const navigate = useNavigate();
  const {channelId} = useParams({strict: false});
  const defaultChannel = Object.keys(channels)[0];
  const activeKey = channelId ?? defaultChannel;

  // eslint-disable-next-line @typescript-eslint/no-restricted-types
  const handleSelect = (key: string | null) => {
    if (key) {
      void navigate({
        to: `/${group}/equalizers/$channelId`,
        params: {channelId: key},
      });
    }
  };

  return (
    <Tabs activeKey={activeKey} id="equalizers" onSelect={handleSelect}>
      {Object.keys(channels).map((channelId) => {
        return (
          <Tab
            key={channelId}
            title={
              isOutputChannel(channels[channelId]) &&
              channels[channelId].channelName
                ? `${channelId}. ${channels[channelId].channelName}`
                : `Channel ${channelId}`
            }
            eventKey={channelId}
          >
            <EqualizerList
              channel={channels[channelId]}
              group={group}
              channelId={channelId}
              isBlocking={isBlocking}
            />
          </Tab>
        );
      })}
    </Tabs>
  );
}

export default React.memo(Equalizers);
