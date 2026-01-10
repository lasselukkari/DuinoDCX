import React from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import EqualizerList from './equalizer-list.tsx';
import { type Channel, isOutputChannel } from 'dcx-parser';

type Props = {
  readonly isBlocking: boolean;
  readonly group: 'inputs' | 'outputs';
  readonly channels: Record<string, Channel>;
};

function Equalizers({ channels, group, isBlocking }: Props) {
  return (
    <Tabs defaultActiveKey={Object.keys(channels)[0]} id="equalizers">
      {Object.keys(channels).map((channelId) => {
        return (
          <Tab
            key={channelId}
            title={
              isOutputChannel(channels[channelId]) && channels[channelId].channelName
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
