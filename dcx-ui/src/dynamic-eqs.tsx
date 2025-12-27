import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import DynamicEQ from './dynamic-eq.tsx';
import {type Channel} from './dcx2496/parser.ts';

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

function DynamicEqs({channels, group, onChange}: Props) {
  return (
    <Row className="show-grid">
      {Object.keys(channels).map((channelId) => {
        const channel = channels[channelId];
        return (
          <Col key={channelId} xs={12} md={6}>
            <DynamicEQ
              key={channelId}
              group={group}
              channelId={channelId}
              channelName={channel.channelName}
              isDynamicEqOn={channel.isDynamicEqOn}
              dynamicEqType={channel.dynamicEqType}
              dynamicEqFrequency={channel.dynamicEqFrequency}
              dynamicEqGain={channel.dynamicEqGain}
              dynamicEqQ={channel.dynamicEqQ}
              dynamicEqShelving={channel.dynamicEqShelving}
              dynamicEqAttack={channel.dynamicEqAttack}
              dynamicEqRelease={channel.dynamicEqRelease}
              dynamicEqRatio={channel.dynamicEqRatio}
              dynamicEqThreshold={channel.dynamicEqThreshold}
              onChange={onChange}
            />
          </Col>
        );
      })}
    </Row>
  );
}

export default React.memo(DynamicEqs, (previousProps, nextProps) => {
  return isEqual(previousProps.channels, nextProps.channels);
});
