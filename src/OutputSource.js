import React, {PureComponent} from 'react';
import FormLabel from 'react-bootstrap/FormLabel';
import PropTypes from 'prop-types';
import pc from './parameters';

class OutputSource extends PureComponent {
  static propTypes = {
    channelName: PropTypes.string.isRequired,
    source: PropTypes.string.isRequired,
    group: PropTypes.string.isRequired,
    channelId: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
  };

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
