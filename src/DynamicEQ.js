import React, {Component} from 'react';
import {Panel, Row, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';
import pc from './parameters';

class DynamicEQ extends Component {
  shouldComponentUpdate(nextProps) {
    const {channel} = this.props;
    return !isEqual(nextProps.channel, channel);
  }
  render() {
    const {channel, group, channelId, onChange} = this.props;
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
      dynamicEQThreshold
    } = channel;

    return (
      <Panel header={channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}>
        <pc.DynamicEQ
          value={dynamicEQ}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
        <Row>
          <Col xs={12} sm={6}>
            <pc.DynamicEQType
              value={dynamicEQType}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          </Col>
          <Col xs={12} sm={6}>
            <pc.DynamicEQFrequency
              value={dynamicEQFrequency}
              group="outputs"
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          </Col>
        </Row>
        <Row>
          <Col xs={12} sm={6}>
            {dynamicEQType === 'Bandpass' && (
              <pc.DynamicEQQ
                value={dynamicEQQ}
                group={group}
                channelId={channelId}
                onChange={onChange}
                includeLabel
              />
            )}
            {dynamicEQType !== 'Bandpass' && (
              <pc.DynamicEQShelving
                value={dynamicEQShelving}
                group={group}
                channelId={channelId}
                onChange={onChange}
                includeLabel
              />
            )}
          </Col>
          <Col xs={12} sm={6}>
            <pc.DynamicEQAttack
              value={dynamicEQAttack}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          </Col>
        </Row>
        <Row>
          <Col xs={12} sm={6}>
            <pc.DynamicEQRelease
              value={dynamicEQRelease}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          </Col>
          <Col xs={12} sm={6}>
            <pc.DynamicEQRatio
              value={dynamicEQRatio}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          </Col>
        </Row>
        <pc.DynamicEQGain
          value={dynamicEQGain}
          group={group}
          channelId={channelId}
          onChange={onChange}
          includeLabel
        />
        <pc.DynamicEQThreshold
          value={dynamicEQThreshold}
          group={group}
          channelId={channelId}
          onChange={onChange}
          includeLabel
        />
      </Panel>
    );
  }
}

export default DynamicEQ;
