import React, {Component} from 'react';
import {Panel, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';
import ChannelName from './ChannelName';

class ChannelNames extends Component {
  shouldComponentUpdate(nextProps) {
    const {channels} = this.props;
    return !isEqual(nextProps.channels, channels);
  }

  render() {
    const {channels, group, onChange, xs, sm, md, lg} = this.props;

    return (
      <Panel>
        <Panel.Heading>Output names</Panel.Heading>
        <Panel.Body>
          {Object.keys(channels).map(channelId => {
            return (
              <Col key={channelId} xs={xs} sm={sm} md={md} lg={lg}>
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
        </Panel.Body>
      </Panel>
    );
  }
}

export default ChannelNames;
