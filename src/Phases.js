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
          return (
            <Col key={channelId} xs={xs} sm={sm} md={md} lg={lg}>
              <Phase
                key={channelId}
                channel={channels[channelId]}
                group={group}
                onChange={onChange}
                channelId={channelId}
              />
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default Phases;
