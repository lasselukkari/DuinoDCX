import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'react-fast-compare';
import {type Channel, isOutputChannel} from 'dcx-parser';
import DynamicEqualizer from '@/components/DynamicEqualizer.tsx';

type Props = {
  readonly group: 'inputs' | 'outputs';
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
              channelName={isOutputChannel(channel) ? channel.channelName : ''}
              isDynamicEqualizerOn={Boolean(channel.isDynamicEqualizerOn)}
              dynamicEqualizerType={channel.dynamicEqualizerType}
              dynamicEqualizerFrequency={channel.dynamicEqualizerFrequency}
              dynamicEqualizerGain={channel.dynamicEqualizerGain}
              dynamicEqualizerQ={channel.dynamicEqualizerQ}
              dynamicEqualizerShelving={channel.dynamicEqualizerShelving}
              dynamicEqualizerAttack={channel.dynamicEqualizerAttack}
              dynamicEqualizerRelease={channel.dynamicEqualizerRelease}
              dynamicEqualizerRatio={channel.dynamicEqualizerRatio}
              dynamicEqualizerThreshold={channel.dynamicEqualizerThreshold}
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
