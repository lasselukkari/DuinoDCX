import React, { PureComponent } from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import FormLabel from 'react-bootstrap/FormLabel';
import Row from 'react-bootstrap/Row';
import pc from './parameters/index.tsx';

type ChangeEventArgs = {
  param: string;
  group?: string;
  channelId?: string;
  value: boolean | number | string;
};

type Props = {
  readonly channelName?: string;
  readonly channelId: string;
  readonly group: string;
  readonly highpassFilter?: string;
  readonly highpassFrequency?: number;
  readonly lowpassFilter?: string;
  readonly lowpassFrequency?: number;
  readonly onChange: (args: ChangeEventArgs) => void;
};

class Crossover extends PureComponent<Props> {
  static defaultProps = {
    channelName: undefined,
    highpassFilter: undefined,
    highpassFrequency: undefined,
    lowpassFilter: undefined,
    lowpassFrequency: undefined,
  };

  render() {
    const {
      highpassFilter,
      highpassFrequency,
      lowpassFilter,
      lowpassFrequency,
      channelName,
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
          <FormLabel>Highpass Filter</FormLabel>
          <Row>
            <Col xs={6}>
              <pc.HighpassFilter
                value={highpassFilter}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col xs={6}>
              <pc.HighpassFrequency
                value={highpassFrequency}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
          </Row>
          <FormLabel>Lowpass Filter</FormLabel>
          <Row>
            <Col xs={6}>
              <pc.LowpassFilter
                value={lowpassFilter}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col xs={6}>
              <pc.LowpassFrequency
                value={lowpassFrequency}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  }
}

export default Crossover;
