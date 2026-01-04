import {memo} from 'react';
import ChannelLevel from './channel-level.js';
import MuteButton from './mute-button.js';
import SelectButton from './select-button.js';

type ToggleChangeEventArgs = {
  group: 'inputs' | 'outputs';
  channelId: string;
  isSelected: boolean;
  index: number;
};

type Props = {
  readonly name: string;
  readonly channelId: string;
  readonly index: number;
  readonly isSelected: boolean;
  readonly group: string;
  readonly isLimited: boolean;
  readonly level: number;
  readonly isMuted: boolean;
  readonly isOutput: boolean;
  readonly onToggleChange: (args: ToggleChangeEventArgs) => void;
};

function ChannelControls({
  isLimited,
  level,
  channelId,
  isOutput,
  isMuted,
  onToggleChange,
  group,
  name,
  isSelected,
  index,
}: Props) {
  return (
    <div>
      <SelectButton
        key={'toggle-' + channelId}
        group={group}
        channelId={channelId}
        name={name}
        isSelected={isSelected}
        index={index}
        onToggle={onToggleChange}
      />
      <MuteButton
        key={'mute-' + channelId}
        channelId={channelId}
        isMuted={isMuted}
        isOutput={isOutput}
      />
      <ChannelLevel
        key={'level-' + channelId}
        isOutput={isOutput}
        isLimited={isLimited}
        level={level}
      />
    </div>
  );
}

export default memo(ChannelControls);
