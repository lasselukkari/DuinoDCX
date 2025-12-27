import {FaRandom, FaVolumeMute, FaVolumeUp} from 'react-icons/fa';
import React, {useState} from 'react';
import Button from 'react-bootstrap/Button';
import ChannelControls from './channel-controls.tsx';
import {type State} from './dcx2496/parser.tsx';
import './ChannelLevels.css';

const inputChannels = ['A', 'B', 'C', 'Sum'];
const outputChannels = ['1', '2', '3', '4', '5', '6'];

type Props = {
  readonly device: State;
  readonly inputs: Array<{isLimited: boolean; level: number}>;
  readonly outputs: Array<{isLimited: boolean; level: number}>;
  readonly onChange: (args: any) => void;
};

type SelectionItem = {
  name: string;
  isSelected: boolean;
  group: 'inputs' | 'outputs';
  channelId: string;
};

type SelectionState = {
  inputs: SelectionItem[];
  outputs: SelectionItem[];
};

function ChannelLevels({device, inputs, outputs, onChange}: Props) {
  const [selected, setSelected] = useState<SelectionState>({
    inputs: inputChannels.map((channelId) => ({
      name: channelId,
      isSelected: false,
      group: 'inputs',
      channelId,
    })),
    outputs: outputChannels.map((channelId) => ({
      name: device.outputs?.[channelId]?.channelName
        ? device.outputs[channelId].channelName
            .match(/\b\w/g)
            ?.join('')
            .toUpperCase() || channelId
        : channelId,
      isSelected: false,
      group: 'outputs',
      channelId,
    })),
  });

  if (!device || !device.isReady || !inputs || !outputs) {
    return null;
  }

  const handleMuteAll = (value: boolean) => {
    const inputsCmd = inputChannels.map((channelId) => ({
      param: 'mute',
      group: 'inputs',
      channelId,
      value,
    }));
    const outputsCmd = outputChannels.map((channelId) => ({
      param: 'mute',
      group: 'outputs',
      channelId,
      value,
    }));

    const commands = inputsCmd.concat(outputsCmd);

    onChange(commands);
  };

  const handleToggleChange = ({
    group,
    index,
    isSelected,
  }: {
    group: 'inputs' | 'outputs';
    index: number;
    isSelected: boolean;
  }) => {
    setSelected((previous) => {
      const nextGroup = [...previous[group]];
      nextGroup[index] = {...nextGroup[index], isSelected: !isSelected};
      return {...previous, [group]: nextGroup};
    });
  };

  const handleToggle = () => {
    const inputCommands = selected.inputs.filter((input) => input.isSelected);
    const outputCommands = selected.outputs.filter(
      (output) => output.isSelected,
    );

    const commands = inputCommands
      .concat(outputCommands)
      .map(({group, channelId}) => ({
        param: 'mute',
        group,
        channelId,
        value: !device[group][channelId].mute,
      }));

    onChange(commands);
  };

  const isAnyUnmuted =
    inputChannels.some((channel) => !device.inputs[channel].mute) ||
    outputChannels.some((channel) => !device.outputs[channel].mute);

  const isAnySelected =
    selected.inputs.some((channel) => channel.isSelected) ||
    selected.outputs.some((channel) => channel.isSelected);

  return (
    <div className="channels-container">
      <div className="channel-group">
        {inputChannels.map((channelId, index) => {
          const {isLimited, level} = inputs[index] || {
            isLimited: false,
            level: -1,
          };
          const {mute} = device.inputs[channelId];
          const {group, name, isSelected} = selected.inputs[index];

          return (
            <ChannelControls
              key={channelId}
              channelId={channelId}
              isOutput={false}
              isMuted={mute}
              isLimited={isLimited}
              level={level}
              group={group}
              name={name}
              isSelected={isSelected}
              index={index}
              onChange={onChange}
              onToggleChange={handleToggleChange}
            />
          );
        })}
      </div>
      <div className="channel-group">
        {outputChannels.map((channelId, index) => {
          const {isLimited, level} = outputs[index];
          const {mute} = device.outputs[channelId];
          const {group, name, isSelected} = selected.outputs[index];

          return (
            <ChannelControls
              key={channelId}
              isOutput
              isMuted={mute}
              group={group}
              level={level}
              isLimited={isLimited}
              channelId={channelId}
              name={name}
              isSelected={isSelected}
              index={index}
              onChange={onChange}
              onToggleChange={handleToggleChange}
            />
          );
        })}
      </div>
      <Button
        className="responsive-rotate-90 pull-left"
        variant={isAnySelected ? 'info' : 'primary'}
        style={{
          margin: '8px 1px 0',
          width: '36px',
          height: '36px',
          padding: '0px',
        }}
        onClick={handleToggle}
      >
        <FaRandom />
      </Button>
      <Button
        className="pull-left"
        id="mute-all"
        variant={isAnyUnmuted ? 'primary' : 'danger'}
        style={{
          width: '150px',
          height: '36px',
          margin: '8px 1px 0',
          padding: '0px',
        }}
        onClick={() => {
          handleMuteAll(isAnyUnmuted);
        }}
      >
        {isAnyUnmuted ? <FaVolumeUp /> : <FaVolumeMute />}
      </Button>
    </div>
  );
}

export default React.memo(ChannelLevels);
