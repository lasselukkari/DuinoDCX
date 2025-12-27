import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import Phase from './phase.tsx';
import {type Channel} from './dcx2496/parser.ts';

type ChangeEventArgs = {
  param: string;
  group?: string;
  channelId?: string;
  value: boolean | number | string;
};

type Props = {
  readonly channels: Record<string, Channel>;
  readonly group: string;
  readonly onChange: (args: ChangeEventArgs) => void;
};

function Phases({channels, group, onChange}: Props) {
  return (
    <Row className="show-grid">
      {Object.keys(channels).map((channelId) => {
        const {channelName, polarity, phase} = channels[channelId];
        return (
          <Col key={channelId} xs={12} md={6}>
            <Phase
              key={channelId}
              group={group}
              channelId={channelId}
              channelName={channelName}
              polarity={polarity}
              phase={phase}
              onChange={onChange}
            />
          </Col>
        );
      })}
    </Row>
  );
}

export default React.memo(Phases, (previousProps, nextProps) => {
  return isEqual(previousProps.channels, nextProps.channels);
});
