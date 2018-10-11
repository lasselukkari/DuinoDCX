import React, {Component} from 'react';
import {Col, Panel, Row} from 'react-bootstrap';
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
      <Panel>
        <Panel.Heading>Output Names</Panel.Heading>
        <Panel.Body>
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
        </Panel.Body>
      </Panel>
    );
  }
}

export default ChannelNames;
