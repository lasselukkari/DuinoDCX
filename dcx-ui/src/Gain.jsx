import React, {PureComponent} from 'react';
import FormLabel from 'react-bootstrap/FormLabel';
import PropTypes from 'prop-types';
import pc from './parameters';

class Gain extends PureComponent {
  static defaultProps = {
    channelName: null
  };

  static propTypes = {
    channelName: PropTypes.string,
    gain: PropTypes.number.isRequired,
    group: PropTypes.string.isRequired,
    channelId: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
  };

  render() {
    const {channelName, gain, group, channelId, onChange} = this.props;

    return (
      <div>
        <FormLabel className="form-header">
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </FormLabel>
        <pc.Gain
          value={gain}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />
      </div>
    );
  }
}

export default Gain;
