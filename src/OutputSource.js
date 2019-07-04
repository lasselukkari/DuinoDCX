import React, {PureComponent} from 'react';
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

export default OutputSource;
