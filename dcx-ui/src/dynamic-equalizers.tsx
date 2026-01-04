import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import DynamicEqualizer from './dynamic-equalizer.tsx';
import {type Channel} from './dcx2496/parser.ts';

type Props = {
  readonly group: string;
  readonly channels: Record<string, Channel>;
};

function DynamicEqualizers({channels, group}: Props) {
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
              isDynamicEqualizerOn={Boolean(channel.isDynamicEqualizerOn)}
              dynamicEqualizerType={channel.dynamicEqualizerType!}
              dynamicEqualizerFrequency={channel.dynamicEqualizerFrequency!}
              dynamicEqualizerGain={channel.dynamicEqualizerGain!}
              dynamicEqualizerQ={channel.dynamicEqualizerQ!}
              dynamicEqualizerShelving={channel.dynamicEqualizerShelving!}
              dynamicEqualizerAttack={channel.dynamicEqualizerAttack!}
              dynamicEqualizerRelease={channel.dynamicEqualizerRelease!}
              dynamicEqualizerRatio={channel.dynamicEqualizerRatio!}
              dynamicEqualizerThreshold={channel.dynamicEqualizerThreshold!}
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
