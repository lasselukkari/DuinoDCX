import {FaRandom, FaVolumeMute, FaVolumeUp} from 'react-icons/fa';
import React, {PureComponent} from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import ChannelControls from './ChannelControls';

import './ChannelLevels.css';

const inputChannels = ['A', 'B', 'C', 'Sum'];
const outputChannels = ['1', '2', '3', '4', '5', '6'];

class ChannelLevels extends PureComponent {
  static propTypes = {
    device: PropTypes.shape({
      isReady: PropTypes.bool.isRequired,
      inputs: PropTypes.object,
      outputs: PropTypes.object
    }).isRequired,
    inputs: PropTypes.arrayOf(
      PropTypes.shape({
        isLimited: PropTypes.bool.isRequired,
        level: PropTypes.number.isRequired
      })
    ).isRequired,
    outputs: PropTypes.arrayOf(
      PropTypes.shape({
        isLimited: PropTypes.bool.isRequired,
        level: PropTypes.number.isRequired
      })
    ).isRequired,
    onChange: PropTypes.func.isRequired
  };

  state = {
    selected: {
      inputs: inputChannels.map((channelId) => ({
        name: channelId,
        isSelected: false,
        group: 'inputs',
        channelId
      })),
      outputs: outputChannels.map((channelId) => ({
        name: this.props.device.outputs[channelId].channelName
          .match(/\b\w/g)
          .join('')
          .toUpperCase(),
        isSelected: false,
        group: 'outputs',
        channelId
      }))
    }
  };

  handleMuteAll = (value) => {
    const {onChange} = this.props;

    const inputs = inputChannels.map((channelId) => ({
      param: 'mute',
      group: 'inputs',
      channelId,
      value
    }));
    const outputs = outputChannels.map((channelId) => ({
      param: 'mute',
      group: 'outputs',
      channelId,
      value
    }));

    const commands = inputs.concat(outputs);

    onChange(commands);
  };

  handleToggleChange = ({group, index, isSelected}) => {
    const selected = Object.assign({}, this.state.selected);
    selected[group][index].isSelected = !isSelected;
    this.setState(() => ({selected}));
  };

  handleToggle = () => {
    const {onChange, device} = this.props;
    const inputCommands = this.state.selected.inputs.filter(
      (input) => input.isSelected
    );
    const outputCommands = this.state.selected.outputs.filter(
      (ouput) => ouput.isSelected
    );

    const commands = inputCommands
      .concat(outputCommands)
      .map(({group, channelId}) => ({
        param: 'mute',
        group,
        channelId,
        value: !device[group][channelId].mute
      }));

    onChange(commands);
  };

  render() {
    const {device, inputs, outputs, onChange} = this.props;

    if (!device || !device.isReady || !inputs || !outputs) {
      return null;
    }

    const isAnyUnmuted =
      inputChannels.some((channel) => !device.inputs[channel].mute) ||
      outputChannels.some((channel) => !device.outputs[channel].mute);

    const isAnySelected =
      this.state.selected.inputs.some((channel) => channel.isSelected) ||
      this.state.selected.outputs.some((channel) => channel.isSelected);

    return (
      <div className="channels-container">
        <div className="channel-group">
          {inputChannels.map((channelId, index) => {
            const {isLimited, level} = inputs[index] || {
              isLimited: false,
              level: -1
            };
            const {mute} = device.inputs[channelId];
            const {group, name, isSelected} = this.state.selected.inputs[index];

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
                onToggleChange={this.handleToggleChange}
              />
            );
          })}
        </div>
        <div className="channel-group">
          {outputChannels.map((channelId, index) => {
            const {isLimited, level} = outputs[index];
            const {mute} = device.outputs[channelId];
            const {group, name, isSelected} = this.state.selected.outputs[
              index
            ];

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
                onToggleChange={this.handleToggleChange}
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
            padding: '0px'
          }}
          onClick={this.handleToggle}
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
            padding: '0px'
          }}
          onClick={() => this.handleMuteAll(isAnyUnmuted)}
        >
          {isAnyUnmuted ? <FaVolumeUp /> : <FaVolumeMute />}
        </Button>
      </div>
    );
  }
}

export default ChannelLevels;
