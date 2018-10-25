import React, {PureComponent} from 'react';
import {Panel, Row, Col} from 'react-bootstrap';

import pc from './parameters';

class EQ extends PureComponent {
  render() {
    const {
      eQType,
      eQFrequency,
      eQQ,
      eQShelving,
      eQGain,
      id,
      onChange,
      group,
      channelId
    } = this.props;

    return (
      <Panel>
        <Panel.Heading>{`Equalizer ${id}`}</Panel.Heading>
        <Panel.Body>
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
                  value={eQQ}
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
        </Panel.Body>
      </Panel>
    );
  }
}

export default EQ;
