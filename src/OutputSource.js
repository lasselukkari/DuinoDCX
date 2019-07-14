import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {FormLabel} from 'react-bootstrap';

import pc from './parameters';

class OutputSource extends PureComponent {
  render() {
    const {channelName, source, channelId, onChange, group} = this.props;
    return (
      <div>
        <FormLabel>
          {channelName ? channelId + '. ' + channelName : channelId}
        </FormLabel>
        <pc.Source
          value={source}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
      </div>
    );
  }
}

OutputSource.propTypes = {
  channelName: PropTypes.string.isRequired,
  source: PropTypes.string.isRequired,
  group: PropTypes.string.isRequired,
  channelId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default OutputSource;
