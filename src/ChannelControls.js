import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import ChannelLevel from './ChannelLevel';
import MuteButton from './MuteButton';
import SelectButton from './SelectButton';

class ChannelControls extends PureComponent {
  static defaultProps = {
    isToggled: false
  };

  static propTypes = {
    name: PropTypes.string.isRequired,
    channelId: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    isSelected: PropTypes.bool.isRequired,
    group: PropTypes.string.isRequired,
    isLimited: PropTypes.bool.isRequired,
    level: PropTypes.number.isRequired,
    isMuted: PropTypes.bool.isRequired,
    isOutput: PropTypes.bool.isRequired,
    isToggled: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    onToggleChange: PropTypes.func.isRequired
  };

  render() {
    const {
      isLimited,
      level,
      onChange,
      channelId,
      isOutput,
      isMuted,
      isToggled,
      onToggleChange,
      group,
      name,
      isSelected,
      index
    } = this.props;
    return (
      <div>
        <SelectButton
          key={'toggle-' + channelId}
          state={isToggled}
          group={group}
          channelId={channelId}
          name={name}
          isSelected={isSelected}
          index={index}
          onChange={onToggleChange}
        />
        <MuteButton
          key={'mute-' + channelId}
          channelId={channelId}
          isMuted={isMuted}
          isOutput={isOutput}
          onChange={onChange}
        />
        <ChannelLevel
          key={'level-' + channelId}
          channelId={channelId}
          isMuted={isMuted}
          isOutput={isOutput}
          isLimited={isLimited}
          level={level}
          onChange={onChange}
        />
      </div>
    );
  }
}

export default ChannelControls;
