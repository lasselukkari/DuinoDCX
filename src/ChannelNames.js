import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Col, Card, Row} from 'react-bootstrap';
import isEqual from 'lodash.isequal';
import ChannelName from './ChannelName';

class ChannelNames extends Component {
  shouldComponentUpdate(nextProps) {
    const {channels} = this.props;
    return !isEqual(nextProps.channels, channels);
  }

  render() {
    const {channels, group, onChange} = this.props;

    return (
      <Card>
        <Card.Header>Output Names</Card.Header>
        <Card.Body>
          <Row>
            {Object.keys(channels).map(channelId => {
              return (
                <Col key={channelId} xs={12} sm={6} md={4}>
                  <ChannelName
                    key={channelId}
                    group={group}
                    channelId={channelId}
                    channelName={channels[channelId].channelName}
                    onChange={onChange}
                  />
                </Col>
              );
            })}
          </Row>
        </Card.Body>
      </Card>
    );
  }
}

ChannelNames.propTypes = {
  onChange: PropTypes.func.isRequired,
  group: PropTypes.string.isRequired,
  channels: PropTypes.objectOf(
    PropTypes.shape({
      channelName: PropTypes.string
    })
  ).isRequired
};

export default ChannelNames;
