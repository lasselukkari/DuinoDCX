import {FaRandom, FaVolumeMute, FaVolumeUp} from 'react-icons/fa';
import React, {useState} from 'react';
import Button from 'react-bootstrap/Button';
import type {State} from 'dcx-parser';
import './ChannelLevels.css';
import ChannelControls from '@/components/ChannelControls.tsx';
import {useSendCommand, type BatchCommand} from '@/hooks/useSendCommand.ts';

const inputChannels = ['A', 'B', 'C', 'Sum'];
const outputChannels = ['1', '2', '3', '4', '5', '6'];

type Props = {
  readonly device?: State;
  readonly inputs: Array<{isLimited: boolean; level: number}>;
  readonly outputs: Array<{isLimited: boolean; level: number}>;
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

function ChannelLevels({device, inputs, outputs}: Props) {
  const sendCommand = useSendCommand();

  const [selected, setSelected] = useState<SelectionState>(() => ({
    inputs: inputChannels.map((channelId) => ({
      name: channelId,
      isSelected: false,
      group: 'inputs',
      channelId,
    })),
    outputs: outputChannels.map((channelId) => ({
      name: device?.outputs?.[channelId]?.channelName
        ? (device.outputs[channelId].channelName
            .match(/\b\w/g)
            ?.join('')
            .toUpperCase() ?? channelId)
        : channelId,
      isSelected: false,
      group: 'outputs',
      channelId,
    })),
  }));

  if (!device || !inputs || !outputs) {
    return undefined;
  }

  const handleMuteAll = (value: boolean) => {
    const inputsCmd: BatchCommand[] = inputChannels.map((channelId) => ({
      target: {
        kind: 'channel' as const,
        group: 'inputs' as const,
        id: channelId,
        key: 'mute',
      },
      value,
    }));
    const outputsCmd: BatchCommand[] = outputChannels.map((channelId) => ({
      target: {
        kind: 'channel' as const,
        group: 'outputs' as const,
        id: channelId,
        key: 'mute',
      },
      value,
    }));

    const commands = [...inputsCmd, ...outputsCmd];
    void sendCommand(commands);
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
    const inputCommands: BatchCommand[] = selected.inputs
      .filter((input) => input.isSelected)
      .map(({group, channelId}) => ({
        target: {
          kind: 'channel' as const,
          group,
          id: channelId,
          key: 'mute',
        },
        value: !device.inputs[channelId].mute,
      }));
    const outputCommands: BatchCommand[] = selected.outputs
      .filter((output) => output.isSelected)
      .map(({group, channelId}) => ({
        target: {
          kind: 'channel' as const,
          group,
          id: channelId,
          key: 'mute',
        },
        value: !device.outputs[channelId].mute,
      }));

    const commands = [...inputCommands, ...outputCommands];
    void sendCommand(commands);
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
          const {isLimited, level} = inputs[index] ?? {
            isLimited: false,
            level: -1,
          };
          const {mute = false} = device.inputs[channelId];
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
              onToggleChange={handleToggleChange}
            />
          );
        })}
      </div>
      <div className="channel-group">
        {outputChannels.map((channelId, index) => {
          const {isLimited, level} = outputs[index] ?? {
            isLimited: false,
            level: -1,
          };
          const {mute = false} = device.outputs[channelId];
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
