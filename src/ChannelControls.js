import React, {PureComponent} from 'react';
import MuteButton from './MuteButton';
import SelectButton from './SelectButton';
import ChannelLevel from './ChannelLevel';

class ChannelControls extends PureComponent {
  render() {
    const {
      limited,
      level,
      onChange,
      channelId,
      isOutput,
      isMuted,
      toggleState,
      onToggleChange,
      group,
      name,
      selected,
      index
    } = this.props;
    return (
      <div>
        <SelectButton
          key={'toggle-' + channelId}
          state={toggleState}
          group={group}
          channelId={channelId}
          name={name}
          selected={selected}
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
          limited={limited}
          level={level}
          onChange={onChange}
        />
      </div>
    );
  }
}

export default ChannelControls;
