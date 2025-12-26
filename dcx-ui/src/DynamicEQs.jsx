import React, {Component} from 'react';
import Col from 'react-bootstrap/Col';
import PropTypes from 'prop-types';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import DynamicEQ from './DynamicEQ';

class DynamicEQs extends Component {
  static propTypes = {
    group: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    channels: PropTypes.objectOf(
      PropTypes.shape({
        isDynamicEQOn: PropTypes.bool.isRequired,
        dynamicEQType: PropTypes.string.isRequired,
        dynamicEQFrequency: PropTypes.string.isRequired,
        dynamicEQGain: PropTypes.number.isRequired,
        dynamicEQQ: PropTypes.string.isRequired,
        dynamicEQShelving: PropTypes.string.isRequired,
        dynamicEQAttack: PropTypes.string.isRequired,
        dynamicEQRelease: PropTypes.string.isRequired,
        dynamicEQRatio: PropTypes.string.isRequired,
        dynamicEQThreshold: PropTypes.number.isRequired,
        channelName: PropTypes.string
      })
    ).isRequired
  };

  shouldComponentUpdate(nextProps) {
    const {channels} = this.props;
    return !isEqual(channels, nextProps.channels);
  }

  render() {
    const {channels, group, onChange} = this.props;
    return (
      <Row className="show-grid">
        {Object.keys(channels).map((channelId) => {
          const channel = channels[channelId];
          return (
            <Col key={channelId} xs={12} md={6}>
              <DynamicEQ
                key={channelId}
                group={group}
                channelId={channelId}
                channelName={channel.channelName}
                isDynamicEQOn={channel.isDynamicEQOn}
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
