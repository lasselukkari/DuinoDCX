import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Col, Card, Row} from 'react-bootstrap';
import isEqual from 'lodash.isequal';

import OutputSource from './OutputSource';

class OutputSources extends Component {
  shouldComponentUpdate(nextProps) {
    const {channels} = this.props;
    return !isEqual(channels, nextProps.channels);
  }

  render() {
    const {channels, group, onChange} = this.props;

    return (
      <Card>
        <Card.Header>Output Source</Card.Header>
        <Card.Body>
          <Row>
            {Object.keys(channels).map(channelId => {
              const {channelName, source} = channels[channelId];
              return (
                <Col key={channelId} sm={4} xs={12}>
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
          </Row>
        </Card.Body>
      </Card>
    );
  }
}

OutputSources.propTypes = {
  channels: PropTypes.object.isRequired,
  group: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default OutputSources;
