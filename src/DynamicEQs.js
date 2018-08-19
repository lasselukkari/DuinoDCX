import React, {Component} from 'react';
import {Row, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';
import DynamicEQ from './DynamicEQ';

class DynamicEQs extends Component {
  shouldComponentUpdate(nextProps) {
    const {channels} = this.props;
    return !isEqual(channels, nextProps.channels);
  }

  render() {
    const {channels, group, onChange, xs, sm, md, lg} = this.props;
    return (
      <Row className="show-grid">
        {Object.keys(channels).map(channelId => {
          const channel = channels[channelId];
          return (
            <Col key={channelId} xs={xs} sm={sm} md={md} lg={lg}>
              <DynamicEQ
                key={channelId}
                group={group}
                channelId={channelId}
                channelName={channel.channelName}
                dynamicEQ={channel.dynamicEQ}
                dynamicEQType={channel.dynamicEQType}
                dynamicEQFrequency={channel.dynamicEQFrequency}
                dynamicEQGain={channel.dynamicEQGain}
                dynamicEQQ={channel.dynamicEQQ}
                dynamicEQShelving={channel.dynamicEQShelving}
                dynamicEQAttack={channel.dynamicEQAttack}
                dynamicEQRelease={channel.dynamicEQRelease}
                dynamicEQRatio={channel.dynamicEQRatio}
                dynamicEQThreshold={channel.dynamicEQThreshold}
                onChange={onChange}
              />
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default DynamicEQs;
