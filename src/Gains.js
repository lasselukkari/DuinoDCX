import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Row, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';
import Gain from './Gain';

class Gains extends Component {
  shouldComponentUpdate(nextProps) {
    const {channels} = this.props;
    return !isEqual(channels, nextProps.channels);
  }

  render() {
    const {channels, group, onChange} = this.props;

    return (
      <Row className="show-grid">
        {Object.keys(channels).map(channelId => {
          const {channelName, gain} = channels[channelId];
          return (
            <Col key={channelId} xs={12}>
              <Gain
                key={channelId}
                group={group}
                channelId={channelId}
                channelName={channelName}
                gain={gain}
                onChange={onChange}
              />
            </Col>
          );
        })}
      </Row>
    );
  }
}

Gains.propTypes = {
  group: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  channels: PropTypes.objectOf(
    PropTypes.shape({
      channelName: PropTypes.string,
      gain: PropTypes.number.isRequired
    })
  ).isRequired
};

export default Gains;
