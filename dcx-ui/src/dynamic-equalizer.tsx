import React, { PureComponent } from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import pc, { type ChangeEventArgs } from './parameters/index.tsx';

type DynamicEqualizerProps = {
  readonly channelName?: string | undefined;
  readonly isDynamicEQOn: boolean;
  readonly dynamicEQType: string;
  readonly dynamicEQFrequency: number | string;
  readonly dynamicEQGain: number | string;
  readonly dynamicEQQ: number | string;
  readonly dynamicEQShelving: string;
  readonly dynamicEQAttack: number | string;
  readonly dynamicEQRelease: number | string;
  readonly dynamicEQRatio: number | string;
  readonly dynamicEQThreshold: number | string;
  readonly group: string;
  readonly channelId: string | number;
  readonly onChange: (args: ChangeEventArgs) => void;
};

class DynamicEqualizer extends PureComponent<DynamicEqualizerProps> {
  static defaultProps = {
    channelName: null,
  };

  render() {
    const {
      channelName,
      isDynamicEQOn,
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
      onChange,
    } = this.props;

    return (
      <Card>
        <Card.Header>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Card.Header>
        <Card.Body>
          <pc.IsDynamicEQOn
            isTrue={isDynamicEQOn}
            group={group}
            channelId={channelId as string}
            onChange={onChange}
          />
          <Row>
            <Col md={12} lg={6}>
              <pc.DynamicEQType
                hasLabel
                value={dynamicEQType}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col md={12} lg={6}>
              <pc.DynamicEQFrequency
                hasLabel
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
                  hasLabel
                  value={dynamicEQQ}
                  group={group}
                  channelId={channelId}
                  onChange={onChange}
                />
              )}
              {dynamicEQType !== 'Bandpass' && (
                <pc.DynamicEQShelving
                  hasLabel
                  value={dynamicEQShelving}
                  group={group}
                  channelId={channelId}
                  onChange={onChange}
                />
              )}
            </Col>
            <Col md={12} lg={6}>
              <pc.DynamicEQAttack
                hasLabel
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
                hasLabel
                value={dynamicEQRelease}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col md={12} lg={6}>
              <pc.DynamicEQRatio
                hasLabel
                value={dynamicEQRatio}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
          </Row>
          <pc.DynamicEQGain
            hasLabel
            value={dynamicEQGain}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
          <pc.DynamicEQThreshold
            hasLabel
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

export default DynamicEqualizer;
