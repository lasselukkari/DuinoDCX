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
      <Panel header="Output names">
        {Object.keys(channels).map(channelId => {
          return (
            <Col key={channelId} xs={xs} sm={sm} md={md} lg={lg}>
              <ChannelName
                key={channelId}
                group={group}
                onChange={onChange}
                channelId={channelId}
                channelName={channels[channelId].channelName}
              />
            </Col>
          );
        })}
      </Panel>
    );
  }
}

export default ChannelNames;
