import React, {Component} from 'react';
import {Panel, Row, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import pc from './parameters';

class EQ extends Component {
  shouldComponentUpdate(nextProps) {
    const {eq} = this.props;
    return !isEqual(nextProps.eq, eq);
  }

  render() {
    const {eq, id, onChange, group, channelId} = this.props;

    return (
      <Panel header={`Equalizer ${id}`}>
        <Row>
          <Col xs={12} sm={4}>
            <pc.EQType
              value={eq.eQType}
              eq={id}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          </Col>
          <Col xs={12} sm={4}>
            <pc.EQFrequency
              value={eq.eQFrequency}
              eq={id}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          </Col>
          <Col xs={12} sm={4}>
            {eq.eQType === 'Bandpass' && (
            <pc.EQQ
              value={eq.eqQ}
              eq={id}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          )}
            {eq.eQType !== 'Bandpass' && (
            <pc.EQShelving
              value={eq.eQShelving}
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
          value={eq.eQGain}
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
