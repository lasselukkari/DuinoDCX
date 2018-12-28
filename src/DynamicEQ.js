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
      <Panel>
        <Panel.Heading>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Panel.Heading>
        <Panel.Body>
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
            confirm={({oldValue, newValue, name, unit, formatter}) => {
              if (newValue - oldValue > 6) {
                // eslint-disable-next-line no-alert
                return window.confirm(
                  `You are about to change ${name.toLowerCase()} from ${formatter(
                    oldValue,
                    unit
                  )} to ${formatter(newValue, unit)} (+${formatter(
                    newValue - oldValue,
                    unit
                  )}). Are you sure?`
                );
              }

              return true;
            }}
            onChange={onChange}
          />
          <pc.DynamicEQThreshold
            includeLabel
            value={dynamicEQThreshold}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
        </Panel.Body>
      </Panel>
    );
  }
}

export default DynamicEQ;
