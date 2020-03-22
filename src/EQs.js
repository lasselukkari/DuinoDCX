import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import isEqual from 'lodash.isequal';
import EQList from './EQList';

class EQs extends Component {
  static propTypes = {
    isBlocking: PropTypes.bool.isRequired,
    group: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    channels: PropTypes.objectOf(
      PropTypes.shape({
        channelName: PropTypes.string
      })
    ).isRequired
  };

  shouldComponentUpdate(nextProps) {
    const {channels, isBlocking} = this.props;
    return (
      !isEqual(channels, nextProps.channels) ||
      isBlocking !== nextProps.isBlocking
    );
  }

  render() {
    const {channels, group, onChange, isBlocking} = this.props;

    return (
      <Tabs defaultActiveKey={Object.keys(channels)[0]} id="equalizers">
        {Object.keys(channels).map((channelId) => {
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
                isBlocking={isBlocking}
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
