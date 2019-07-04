import React, {PureComponent} from 'react';
import {Card, Row, Col} from 'react-bootstrap';
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
      <Card>
        <Card.Header>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Card.Header>
        <Card.Body>
          <pc.DynamicEQ
            value={dynamicEQ}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
          <Row>
            <Col md={12} lg={6}>
              <pc.DynamicEQType
                includeLabel
                value={dynamicEQType}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col md={12} lg={6}>
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
            <Col md={12} lg={6}>
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
            <Col md={12} lg={6}>
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
            <Col md={12} lg={6}>
              <pc.DynamicEQRelease
                includeLabel
                value={dynamicEQRelease}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col md={12} lg={6}>
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
        </Card.Body>
      </Card>
    );
  }
}

export default DynamicEQ;
