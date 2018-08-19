import React, {PureComponent} from 'react';
import {Panel, Row, Col} from 'react-bootstrap';

import pc from './parameters';

class EQ extends PureComponent {
  render() {
    const {
      eQType,
      eQFrequency,
      eqQ,
      eQShelving,
      eQGain,
      id,
      onChange,
      group,
      channelId
    } = this.props;

    return (
      <Panel header={`Equalizer ${id}`}>
        <Row>
          <Col xs={12} sm={4}>
            <pc.EQType
              includeLabel
              value={eQType}
              eq={id}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          </Col>
          <Col xs={12} sm={4}>
            <pc.EQFrequency
              includeLabel
              value={eQFrequency}
              eq={id}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          </Col>
          <Col xs={12} sm={4}>
            {eQType === 'Bandpass' && (
              <pc.EQQ
                includeLabel
                value={eqQ}
                eq={id}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            )}
            {eQType !== 'Bandpass' && (
              <pc.EQShelving
                includeLabel
                value={eQShelving}
                eq={id}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            )}
          </Col>
        </Row>
        <pc.EQGain
          includeLabel
          value={eQGain}
          eq={id}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
      </Panel>
    );
  }
}

export default EQ;
