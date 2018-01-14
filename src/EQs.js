import React, {Component} from 'react';
import {Row, Panel, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import EQList from './EQList';

class EQs extends Component {
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
              <Panel
                header={
                  channels[channelId].channelName ?
                    `${channelId} . ${channels[channelId].channelName}` :
                    `Channel ${channelId}`
                }
              >
                <EQList
                  channel={channels[channelId]}
                  group={group}
                  channelId={channelId}
                  onChange={onChange}
                />
              </Panel>
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default EQs;
