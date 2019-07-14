import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {FormLabel} from 'react-bootstrap';
import Dialog from 'react-bootstrap-dialog';
import pc from './parameters';

class Gain extends PureComponent {
  confirmChange = ({oldValue, newValue, name, unit, formatter}) => {
    return new Promise((resolve, reject) => {
      if (newValue - oldValue <= 6) {
        return resolve();
      }

      this.dialog.show({
        title: 'Confirm change',
        body: (
          <div style={{textAlign: 'center'}}>
            <p>
              You are about to change {name.toLowerCase()} from{' '}
              {formatter(oldValue, unit)} to {formatter(newValue, unit)}.
            </p>
            <p>
              This is {formatter(newValue - oldValue, unit)} increase. Are you
              sure?
            </p>
          </div>
        ),
        bsSize: 'md',
        actions: [
          Dialog.CancelAction(() => reject()), // eslint-disable-line new-cap
          Dialog.OKAction(() => resolve()) // eslint-disable-line new-cap
        ],
        onHide: dialog => {
          dialog.hide();
          reject();
        }
      });
    });
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
          confirm={this.confirmChange}
          onChange={onChange}
        />
        <Dialog
          ref={el => {
            this.dialog = el;
          }}
        />
      </div>
    );
  }
}

Gain.defaultProps = {
  channelName: null
};

Gain.propTypes = {
  channelName: PropTypes.string,
  gain: PropTypes.number.isRequired,
  group: PropTypes.string.isRequired,
  channelId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default Gain;
