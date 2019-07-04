import React, {PureComponent} from 'react';
import {FormLabel} from 'react-bootstrap';
import pc from './parameters';

class Gain extends PureComponent {
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
          confirm={({oldValue, newValue, name, unit, formatter}) => {
            if (newValue - oldValue > 6) {
              // eslint-disable-next-line no-alert
              return window.confirm(
                `You are about to change ${name.toLowerCase()} from ${formatter(
                  oldValue,
                  unit
                )} to ${formatter(newValue, unit)} (+${formatter(
                  newValue - oldValue,
                  unit
                )}). Are you sure?`
              );
            }

            return true;
          }}
          onChange={onChange}
        />
      </div>
    );
  }
}

export default Gain;
