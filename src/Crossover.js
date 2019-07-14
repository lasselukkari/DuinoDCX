import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {Row, Col, Card, FormLabel} from 'react-bootstrap';

import pc from './parameters';

class Crossover extends PureComponent {
  render() {
    const {
      highpassFilter,
      highpassFrequency,
      lowpassFilter,
      lowpassFrequency,
      channelName,
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

Crossover.propTypes = {
  channelName: PropTypes.string.isRequired,
  channelId: PropTypes.string.isRequired,
  group: PropTypes.string.isRequired,
  highpassFilter: PropTypes.string.isRequired,
  highpassFrequency: PropTypes.string.isRequired,
  lowpassFilter: PropTypes.string.isRequired,
  lowpassFrequency: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default Crossover;
