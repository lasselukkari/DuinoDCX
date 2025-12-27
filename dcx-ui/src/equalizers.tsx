import React from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import isEqual from 'lodash.isequal';
import EqualizerList from './equalizer-list.tsx';
import { type Channel } from './dcx2496/parser.ts';

type Props = {
  readonly isBlocking: boolean;
  readonly group: string;
  readonly onChange: (args: any) => void;
  readonly channels: Record<string, Channel>;
};

function Equalizers({ channels, group, onChange, isBlocking }: Props) {
  return (
    <Tabs defaultActiveKey={Object.keys(channels)[0]} id="equalizers">
      {Object.keys(channels).map((channelId) => {
        return (
          <Tab
            key={channelId}
            title={
              channels[channelId].channelName
                ? `${channelId}. ${channels[channelId].channelName}`
                : `Input ${channelId}`
            }
            eventKey={channelId}
          >
            <EqualizerList
              channel={channels[channelId]}
              group={group}
              channelId={channelId}
              isBlocking={isBlocking}
              onChange={onChange}
            />
          </Tab>
        );
      })}
    </Tabs>
  );
}

export default React.memo(Equalizers, (previousProps, nextProps) => {
  return (
    isEqual(previousProps.channels, nextProps.channels) &&
    previousProps.isBlocking === nextProps.isBlocking
  );
});
