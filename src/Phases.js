import React, {Component} from 'react';
import {Row, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';
import Phase from './Phase';

class Phases extends Component {
  shouldComponentUpdate(nextProps) {
    const {channels} = this.props;
    return !isEqual(channels, nextProps.channels);
  }

  render() {
    const {channels, group, onChange} = this.props;

    return (
      <Row className="show-grid">
        {Object.keys(channels).map(channelId => {
          const {channelName, polarity, phase} = channels[channelId];
          return (
            <Col key={channelId} xs={12} sm={6} md={4}>
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
