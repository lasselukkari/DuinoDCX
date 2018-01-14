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
      <Panel header="Output source">
        {Object.keys(channels).map(channelId => {
          return (
            <Col key={channelId} xs={xs} sm={sm} md={md} lg={lg}>
              <OutputSource
                key={channelId}
                channel={channels[channelId]}
                group={group}
                onChange={onChange}
                channelId={channelId}
              />
            </Col>
          );
        })}
      </Panel>
    );
  }
}

export default OutputSources;
