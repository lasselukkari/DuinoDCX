import React, {PureComponent} from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

class ChannelLevel extends PureComponent {
  handleClick = () => {
    const {channelId, isMuted, isOutput, onChange} = this.props;
    onChange({
      param: 'mute',
      group: isOutput ? 'outputs' : 'inputs',
      channelId,
      value: !isMuted
    });
  };

  render() {
    const {limited, level, isOutput} = this.props;

    if (limited === undefined || level === undefined) {
      return null;
    }

    return (
      <div className="led-bar">
        <Button
          variant={level >= 1 ? 'success' : 'dark'}
          disabled={level < 1}
        />

        <Button
          variant={level >= 2 ? 'success' : 'dark'}
          disabled={level < 2}
        />

        <Button
          variant={level >= 3 ? 'success' : 'dark'}
          disabled={level < 3}
        />

        <Button
          variant={level >= 4 ? 'success' : 'dark'}
          disabled={level < 4}
        />

        <Button
          variant={level >= 5 ? 'warning' : 'dark'}
          disabled={level < 5}
        />

        <Button variant={level >= 6 ? 'danger' : 'dark'} disabled={level < 6} />

        {isOutput && (
          <Button variant={limited ? 'danger' : 'dark'} disabled={!limited} />
        )}
      </div>
    );
  }
}

ChannelLevel.propTypes = {
  channelId: PropTypes.string.isRequired,
  isMuted: PropTypes.bool.isRequired,
  isOutput: PropTypes.bool.isRequired,
  limited: PropTypes.bool.isRequired,
  level: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ChannelLevel;
