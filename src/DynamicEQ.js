import React, {PureComponent} from 'react';
import {Panel, Row, Col} from 'react-bootstrap';
import pc from './parameters';

class DynamicEQ extends PureComponent {
  render() {
    const {
      channelName,
      dynamicEQ,
      dynamicEQType,
      dynamicEQFrequency,
      dynamicEQGain,
      dynamicEQQ,
      dynamicEQShelving,
      dynamicEQAttack,
      dynamicEQRelease,
      dynamicEQRatio,
      dynamicEQThreshold,
      group,
      channelId,
      onChange
    } = this.props;

    return (
      <Panel
        header={
          channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`
        }
      >
        <pc.DynamicEQ
          value={dynamicEQ}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
        <Row>
          <Col xs={12} sm={6}>
            <pc.DynamicEQType
              includeLabel
              value={dynamicEQType}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          </Col>
          <Col xs={12} sm={6}>
            <pc.DynamicEQFrequency
              includeLabel
              value={dynamicEQFrequency}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          </Col>
        </Row>
        <Row>
          <Col xs={12} sm={6}>
            {dynamicEQType === 'Bandpass' && (
              <pc.DynamicEQQ
                includeLabel
                value={dynamicEQQ}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            )}
            {dynamicEQType !== 'Bandpass' && (
              <pc.DynamicEQShelving
                includeLabel
                value={dynamicEQShelving}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            )}
          </Col>
          <Col xs={12} sm={6}>
            <pc.DynamicEQAttack
              includeLabel
              value={dynamicEQAttack}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          </Col>
        </Row>
        <Row>
          <Col xs={12} sm={6}>
            <pc.DynamicEQRelease
              includeLabel
              value={dynamicEQRelease}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          </Col>
          <Col xs={12} sm={6}>
            <pc.DynamicEQRatio
              includeLabel
              value={dynamicEQRatio}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          </Col>
        </Row>
        <pc.DynamicEQGain
          includeLabel
          value={dynamicEQGain}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
        <pc.DynamicEQThreshold
          includeLabel
          value={dynamicEQThreshold}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
      </Panel>
    );
  }
}

export default DynamicEQ;
