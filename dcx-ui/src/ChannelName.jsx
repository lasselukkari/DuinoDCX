import React, {PureComponent} from 'react';
import FormLabel from 'react-bootstrap/FormLabel';
import PropTypes from 'prop-types';
import pc from './parameters';

class ChannelName extends PureComponent {
  static propTypes = {
    group: PropTypes.string.isRequired,
    channelId: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    channelName: PropTypes.string.isRequired
  };

  render() {
    const {channelName, channelId, onChange, group} = this.props;

    return (
      <div>
        <FormLabel>
          {channelName ? channelId + '. ' + channelName : channelId}
        </FormLabel>
        <pc.ChannelName
          value={channelName}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
      </div>
    );
  }
}

export default ChannelName;
