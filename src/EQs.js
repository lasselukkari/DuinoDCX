import React, {Component} from 'react';
import {Tabs, Tab} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import EQList from './EQList';

class EQs extends Component {
  shouldComponentUpdate(nextProps) {
    const {channels, blocking} = this.props;
    return (
      !isEqual(channels, nextProps.channels) || blocking !== nextProps.blocking
    );
  }

  render() {
    const {channels, group, onChange, blocking} = this.props;

    return (
      <Tabs
        defaultActiveKey={Object.keys(channels)[0]}
        id="equalizers"
      >
        {Object.keys(channels).map(channelId => {
          return (
            <Tab
              key={channelId}
              title={
                channels[channelId].channelName
                  ? `${channelId}. ${channels[channelId].channelName}`
                  : `Input ${channelId}`
              }
              eventKey={channelId}
            >
              <EQList
                channel={channels[channelId]}
                group={group}
                channelId={channelId}
                blocking={blocking}
                onChange={onChange}
              />
            </Tab>
          );
        })}
      </Tabs>
    );
  }
}

export default EQs;
