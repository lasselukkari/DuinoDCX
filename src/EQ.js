import React, {PureComponent} from 'react';
import {Panel, Row, Col} from 'react-bootstrap';

import pc from './parameters';

class EQ extends PureComponent {
  render() {
    const {eQType, eQFrequency, eqQ, eQShelving, eQGain, id, onChange, group, channelId} = this.props;

    return (
      <Panel header={`Equalizer ${id}`}>
        <Row>
          <Col xs={12} sm={4}>
            <pc.EQType
              value={eQType}
              eq={id}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          </Col>
          <Col xs={12} sm={4}>
            <pc.EQFrequency
              value={eQFrequency}
              eq={id}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          </Col>
          <Col xs={12} sm={4}>
            {eQType === 'Bandpass' && (
            <pc.EQQ
              value={eqQ}
              eq={id}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          )}
            {eQType !== 'Bandpass' && (
            <pc.EQShelving
              value={eQShelving}
              eq={id}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          )}
          </Col>
        </Row>
        <pc.EQGain
          value={eQGain}
          eq={id}
          group={group}
          channelId={channelId}
          onChange={onChange}
          includeLabel
        />
      </Panel>
    );
  }
}

export default EQ;
