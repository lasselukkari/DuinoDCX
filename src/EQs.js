import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
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
      <Tabs defaultActiveKey={Object.keys(channels)[0]} id="equalizers">
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

EQs.propTypes = {
  blocking: PropTypes.bool.isRequired,
  group: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  channels: PropTypes.objectOf(
    PropTypes.shape({
      channelName: PropTypes.string
    })
  ).isRequired
};

export default EQs;
