import React, { PureComponent } from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import pc, { type ChangeEventArgs } from './parameters/index.tsx';

type EqualizerProps = {
  readonly eQType: string;
  readonly eQFrequency: number | string;
  readonly eQQ: number | string;
  readonly eQShelving: string;
  readonly eQGain: number | string;
  readonly id: string | number;
  readonly onChange: (args: ChangeEventArgs) => void;
  readonly group: string;
  readonly channelId: string | number;
};

class Equalizer extends PureComponent<EqualizerProps> {
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
      channelId,
    } = this.props;

    return (
      <Card>
        <Card.Header>{`Equalizer ${id}`}</Card.Header>
        <Card.Body>
          <Row>
            <Col xs={12} sm={4}>
              <pc.EQType
                hasLabel
                value={eQType}
                eq={id as string}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col xs={12} sm={4}>
              <pc.EQFrequency
                hasLabel
                value={eQFrequency}
                eq={id as string}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col xs={12} sm={4}>
              {eQType === 'Bandpass' && (
                <pc.EQQ
                  hasLabel
                  value={eQQ}
                  eq={id as string}
                  group={group}
                  channelId={channelId}
                  onChange={onChange}
                />
              )}
              {eQType !== 'Bandpass' && (
                <pc.EQShelving
                  hasLabel
                  value={eQShelving}
                  eq={id as string}
                  group={group}
                  channelId={channelId}
                  onChange={onChange}
                />
              )}
            </Col>
          </Row>
          <pc.EQGain
            hasLabel
            value={eQGain}
            eq={id as string}
            group={group}
            channelId={channelId as string}
            onChange={onChange}
          />
        </Card.Body>
      </Card>
    );
  }
}

export default Equalizer;
