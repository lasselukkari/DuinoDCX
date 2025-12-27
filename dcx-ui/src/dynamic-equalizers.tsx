import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import DynamicEqualizer from './dynamic-equalizer.tsx';
import { type Channel } from './dcx2496/parser.ts';

type ChangeEventArgs = {
  param: string;
  group?: string;
  channelId?: string;
  value: boolean | number | string;
};

type Props = {
  readonly group: string;
  readonly onChange: (args: ChangeEventArgs) => void;
  readonly channels: Record<string, Channel>;
};

function DynamicEqualizers({ channels, group, onChange }: Props) {
  return (
    <Row className="show-grid">
      {Object.keys(channels).map((channelId) => {
        const channel = channels[channelId];
        return (
          <Col key={channelId} xs={12} md={6}>
            <DynamicEqualizer
              key={channelId}
              group={group}
              channelId={channelId}
              channelName={channel.channelName}
              isDynamicEQOn={channel.isDynamicEQOn as boolean}
              dynamicEQType={channel.dynamicEQType as string}
              dynamicEQFrequency={channel.dynamicEQFrequency as number}
              dynamicEQGain={channel.dynamicEQGain as number}
              dynamicEQQ={channel.dynamicEQQ as number}
              dynamicEQShelving={channel.dynamicEQShelving as string}
              dynamicEQAttack={channel.dynamicEQAttack as string}
              dynamicEQRelease={channel.dynamicEQRelease as string}
              dynamicEQRatio={channel.dynamicEQRatio as string}
              dynamicEQThreshold={channel.dynamicEQThreshold as number}
              onChange={onChange}
            />
          </Col>
        );
      })}
    </Row>
  );
}

export default React.memo(DynamicEqualizers, (previousProps, nextProps) => {
  return isEqual(previousProps.channels, nextProps.channels);
});
