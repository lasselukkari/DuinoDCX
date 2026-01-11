import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import {type OutputChannel} from 'dcx-parser';
import Crossover from './crossover.tsx';

type Props = {
  readonly channels: Record<string, OutputChannel>;
};

function Crossovers({channels}: Props) {
  return (
    <div>
      <Row className="show-grid">
        {Object.keys(channels).map((channelId) => {
          const {
            highpassFilter,
            highpassFrequency,
            lowpassFilter,
            lowpassFrequency,
            channelName,
          } = channels[channelId];
          return (
            <Col key={channelId} xs={12} sm={6} md={4}>
              <Crossover
                channelId={channelId}
                highpassFilter={highpassFilter}
                highpassFrequency={highpassFrequency}
                lowpassFilter={lowpassFilter}
                lowpassFrequency={lowpassFrequency}
                channelName={channelName}
              />
            </Col>
          );
        })}
      </Row>
    </div>
  );
}

export default React.memo(Crossovers, (previousProps, nextProps) => {
  return isEqual(previousProps.channels, nextProps.channels);
});
