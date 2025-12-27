import React from 'react';
import Card from 'react-bootstrap/Card';
import isEqual from 'lodash.isequal';
import Delay from './delay.tsx';
import pc from './parameters/index.tsx';
import {type Channel, type Setup} from './dcx2496/parser.ts';

type Props = {
  readonly group: string;
  readonly onChange: (args: any) => void;
  readonly channels: Record<string, Channel>;
  readonly setup: Setup;
};

function Delays({channels, setup, group, onChange}: Props) {
  const {airTemperature, isDelayCorrectionOn, delayLink, delayUnits} = setup;

  return (
    <div>
      {group === 'outputs' && (
        <Card>
          <Card.Header>Long Delay Link</Card.Header>
          <Card.Body>
            <pc.DelayLink isTrue={delayLink} onChange={onChange} />
          </Card.Body>
        </Card>
      )}

      {Object.keys(channels).map((channelId) => {
        const channel = channels[channelId];
        return (
          <Delay
            key={channelId}
            group={group}
            channelId={channelId}
            isDelayOn={channel.isDelayOn ?? false}
            delayUnits={delayUnits}
            shortDelay={channel.shortDelay ?? 0}
            longDelay={channel.longDelay ?? 0}
            airTemperature={airTemperature}
            isDelayCorrectionOn={isDelayCorrectionOn}
            channelName={channel.channelName ?? ''}
            onChange={onChange}
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
