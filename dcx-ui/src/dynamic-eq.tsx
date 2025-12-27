import React from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import pc from './parameters/index.tsx';

type Props = {
  readonly isDynamicEqOn: boolean;

  readonly dynamicEqType: string;

  readonly dynamicEqFrequency: string;

  readonly dynamicEqGain: number;

  readonly dynamicEqQ: string;

  readonly dynamicEqShelving: string;

  readonly dynamicEqAttack: string;

  readonly dynamicEqRelease: string;

  readonly dynamicEqRatio: string;

  readonly dynamicEqThreshold: number;

  readonly group: string;

  readonly channelId: string;

  readonly channelName?: string | undefined;

  readonly onChange: (args: any) => void;
};

function DynamicEq({
  channelName,
  isDynamicEqOn,
  dynamicEqType,
  dynamicEqFrequency,
  dynamicEqGain,
  dynamicEqQ,
  dynamicEqShelving,
  dynamicEqAttack,
  dynamicEqRelease,
  dynamicEqRatio,
  dynamicEqThreshold,
  group,
  channelId,
  onChange,
}: Props) {
  return (
    <Card>
      <Card.Header>
        {channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}
      </Card.Header>
      <Card.Body>
        <pc.IsDynamicEqOn
          isTrue={isDynamicEqOn}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
        <Row>
          <Col md={12} lg={6}>
            <pc.DynamicEqType
              hasLabel
              value={dynamicEqType}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          </Col>
          <Col md={12} lg={6}>
            <pc.DynamicEqFrequency
              hasLabel
              value={dynamicEqFrequency}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12} lg={6}>
            {dynamicEqType === 'Bandpass' && (
              <pc.DynamicEqQ
                hasLabel
                value={dynamicEqQ}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            )}
            {dynamicEqType !== 'Bandpass' && (
              <pc.DynamicEqShelving
                hasLabel
                value={dynamicEqShelving}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            )}
          </Col>
          <Col md={12} lg={6}>
            <pc.DynamicEqAttack
              hasLabel
              value={dynamicEqAttack}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12} lg={6}>
            <pc.DynamicEqRelease
              hasLabel
              value={dynamicEqRelease}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          </Col>
          <Col md={12} lg={6}>
            <pc.DynamicEqRatio
              hasLabel
              value={dynamicEqRatio}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          </Col>
        </Row>
        <pc.DynamicEqGain
          hasLabel
          value={dynamicEqGain}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
        <pc.DynamicEqThreshold
          hasLabel
          value={dynamicEqThreshold}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
      </Card.Body>
    </Card>
  );
}

export default DynamicEq;
