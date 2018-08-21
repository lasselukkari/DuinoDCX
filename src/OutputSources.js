import React, {Component} from 'react';
import {Panel, Col} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import OutputSource from './OutputSource';

class OutputSources extends Component {
  shouldComponentUpdate(nextProps) {
    const {channels} = this.props;
    return !isEqual(channels, nextProps.channels);
  }

  render() {
    const {channels, group, onChange, xs, sm, md, lg} = this.props;

    return (
      <Panel>
        <Panel.Heading>Output source</Panel.Heading>
        <Panel.Body>
          {Object.keys(channels).map(channelId => {
            const {channelName, source} = channels[channelId];
            return (
              <Col key={channelId} xs={xs} sm={sm} md={md} lg={lg}>
                <OutputSource
                  key={channelId}
                  group={group}
                  channelId={channelId}
                  channelName={channelName}
                  source={source}
                  onChange={onChange}
                />
              </Col>
            );
          })}
        </Panel.Body>
      </Panel>
    );
  }
}

export default OutputSources;
