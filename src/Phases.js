import React, {Component} from 'react';
import Col from 'react-bootstrap/Col';
import PropTypes from 'prop-types';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import Phase from './Phase';

class Phases extends Component {
  static propTypes = {
    channels: PropTypes.object.isRequired,
    group: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
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
          const {channelName, polarity, phase} = channels[channelId];
          return (
            <Col key={channelId} xs={12} md={6}>
              <Phase
                key={channelId}
                group={group}
                channelId={channelId}
                channelName={channelName}
                polarity={polarity}
                phase={phase}
                onChange={onChange}
              />
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default Phases;
