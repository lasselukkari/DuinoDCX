import React from 'react';
import ChannelLevel from './channel-level.tsx';
import MuteButton from './mute-button.tsx';
import SelectButton from './select-button.tsx';

type ChangeEventArgs = {
  param?: string;
  group?: string;
  channelId?: string;
  value?: boolean | number | string;
};

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
  readonly isToggled?: boolean;
  readonly onChange: (args: ChangeEventArgs) => void;
  readonly onToggleChange: (args: ToggleChangeEventArgs) => void;
};

function ChannelControls({
  isLimited,
  level,
  onChange,
  channelId,
  isOutput,
  isMuted,
  isToggled = false,
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
        onChange={onToggleChange} // SelectButton uses onChange to trigger onToggleChange behavior from parent
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
        // Removed invalid props: channelId, isMuted, onChange
        isOutput={isOutput}
        isLimited={isLimited}
        level={level}
      />
    </div>
  );
}

export default React.memo(ChannelControls);
