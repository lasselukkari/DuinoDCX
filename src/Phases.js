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
    const {channels, group, onChange, xs, sm, md, lg} = this.props;

    return (
      <Row className="show-grid">
        {Object.keys(channels).map(channelId => {
          const {channelName, polarity, phase} = channels[channelId];
          return (
            <Col key={channelId} xs={xs} sm={sm} md={md} lg={lg}>
              <Phase
                key={channelId}
                group={group}
                onChange={onChange}
                channelId={channelId}
                channelName={channelName}
                polarity={polarity}
                phase={phase}
              />
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default Phases;
