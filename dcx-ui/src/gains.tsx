import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import Gain from './gain.tsx';

type Props = {
  readonly group: string;
  readonly onChange: (args: any) => void;
  readonly channels: Record<
    string,
    {
      channelName: string;
      gain: number;
    }
  >;
};

function Gains({channels, group, onChange}: Props) {
  return (
    <Row className="show-grid">
      {Object.keys(channels).map((channelId) => {
        const {channelName, gain} = channels[channelId];
        return (
          <Col key={channelId} xs={12}>
            <Gain
              key={channelId}
              group={group}
              channelId={channelId}
              channelName={channelName}
              gain={gain}
              onChange={onChange}
            />
          </Col>
        );
      })}
    </Row>
  );
}

export default React.memo(Gains, (previousProps, nextProps) => {
  return isEqual(previousProps.channels, nextProps.channels);
});
