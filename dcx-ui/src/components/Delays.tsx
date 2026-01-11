import React from 'react';
import Card from 'react-bootstrap/Card';
import isEqual from 'react-fast-compare';
import {type Channel, type Setup, isOutputChannel} from 'dcx-parser';
import Delay from '@/components/Delay.tsx';
import {setup as setupParameters} from '@/components/parameters/index.tsx';

type Props = {
  readonly group: 'inputs' | 'outputs';
  readonly channels: Record<string, Channel>;
  readonly setup: Setup;
};

function Delays({channels, setup, group}: Props) {
  const {airTemperature, isDelayCorrectionOn, delayLink, delayUnits} = setup;

  return (
    <div>
      {group === 'outputs' && (
        <Card>
          <Card.Header>Long Delay Link</Card.Header>
          <Card.Body>
            <setupParameters.DelayLink value={delayLink ?? false} />
          </Card.Body>
        </Card>
      )}

      {Object.keys(channels).map((id) => {
        const channel = channels[id];
        return (
          <Delay
            key={id}
            group={group}
            channelId={id}
            isDelayOn={channel.isDelayOn ?? false}
            delayUnits={delayUnits ?? 'mm'}
            shortDelay={isOutputChannel(channel) ? channel.shortDelay : 0}
            longDelay={channel.longDelay ?? 0}
            airTemperature={airTemperature ?? 20}
            isDelayCorrectionOn={isDelayCorrectionOn ?? false}
            channelName={isOutputChannel(channel) ? channel.channelName : ''}
          />
        );
      })}
    </div>
  );
}

export default React.memo(Delays, (previousProps, nextProps) => {
  return (
    isEqual(previousProps.channels, nextProps.channels) &&
    previousProps.setup.airTemperature === nextProps.setup.airTemperature &&
    previousProps.setup.delayLink === nextProps.setup.delayLink &&
    previousProps.setup.isDelayCorrectionOn ===
      nextProps.setup.isDelayCorrectionOn &&
    previousProps.setup.delayUnits === nextProps.setup.delayUnits
  );
});
