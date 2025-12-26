import React, {PureComponent} from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import PropTypes from 'prop-types';
import Row from 'react-bootstrap/Row';
import pc from './parameters';

class EQ extends PureComponent {
  static propTypes = {
    channelId: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    group: PropTypes.string.isRequired,
    eQType: PropTypes.string.isRequired,
    eQFrequency: PropTypes.string.isRequired,
    eQQ: PropTypes.string.isRequired,
    eQShelving: PropTypes.string.isRequired,
    eQGain: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
  };

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
      <Card>
        <Card.Header>{`Equalizer ${id}`}</Card.Header>
        <Card.Body>
          <Row>
            <Col xs={12} sm={4}>
              <pc.EQType
                hasLabel
                value={eQType}
                eq={id}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col xs={12} sm={4}>
              <pc.EQFrequency
                hasLabel
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
                  hasLabel
                  value={eQQ}
                  eq={id}
                  group={group}
                  channelId={channelId}
                  onChange={onChange}
                />
              )}
              {eQType !== 'Bandpass' && (
                <pc.EQShelving
                  hasLabel
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
            hasLabel
            value={eQGain}
            eq={id}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
        </Card.Body>
      </Card>
    );
  }
}

export default EQ;
