import React, {PureComponent} from 'react';
import {Button, Glyphicon} from 'react-bootstrap';
import ChannelControls from './ChannelControls';

import './ChannelLevels.css'; // eslint-disable-line import/no-unassigned-import

const inputChannels = ['A', 'B', 'C'];
const outputChannels = ['1', '2', '3', '4', '5', '6'];

class ChannelLevels extends PureComponent {
  constructor(props) {
    super(props);

    const {device} = this.props;

    const inputs = inputChannels.map(channelId => ({
      name: channelId,
      selected: false,
      group: 'inputs',
      channelId
    }));

    const outputs = outputChannels.map(channelId => ({
      name: device.outputs[channelId].channelName
        .match(/\b\w/g)
        .join('')
        .toUpperCase(),
      selected: false,
      group: 'outputs',
      channelId
    }));

    this.state = {selected: {inputs, outputs}};
  }

  handleMuteAll = value => {
    const {onChange} = this.props;

    const inputs = inputChannels.map(channelId => ({
      param: 'mute',
      group: 'inputs',
      channelId,
      value
    }));
    const outputs = outputChannels.map(channelId => ({
      param: 'mute',
      group: 'outputs',
      channelId,
      value
    }));

    const commands = inputs.concat(outputs);

    onChange(commands);
  };

  handleToggleChange = ({group, index, selected: isSelected}) => {
    const selected = Object.assign({}, this.state.selected);
    selected[group][index].selected = !isSelected;
    this.setState(() => ({selected}));
  };

  handleToggle = () => {
    const {onChange, device} = this.props;
    const inputCommands = this.state.selected.inputs.filter(
      input => input.selected
    );
    const outputCommands = this.state.selected.outputs.filter(
      ouput => ouput.selected
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
    const {device, onChange} = this.props;
    const {inputs, outputs, state} = device;
    const {channels} = state;
    const isAnyUnmuted =
      inputChannels.some(channel => !inputs[channel].mute) ||
      outputChannels.some(channel => !outputs[channel].mute);

    const isAnySelected =
      this.state.selected.inputs.some(channel => channel.selected) ||
      this.state.selected.outputs.some(channel => channel.selected);

    return (
      <div className="channels-container">
        <div className="channel-group">
          {inputChannels.map((channelId, index) => {
            const {limited, level} = channels[channelId];
            const {mute} = inputs[channelId];
            const {group, name, selected} = this.state.selected.inputs[index];
            return (
              <ChannelControls
                key={channelId}
                channelId={channelId}
                isMuted={mute}
                limited={limited}
                level={level}
                group={group}
                name={name}
                selected={selected}
                index={index}
                onChange={onChange}
                onToggleChange={this.handleToggleChange}
              />
            );
          })}
        </div>
        <div className="channel-group">
          {outputChannels.map((channelId, index) => {
            const {limited, level} = channels[channelId];
            const {mute} = outputs[channelId];
            const isOutput = true;
            const {group, name, selected} = this.state.selected.outputs[index];

            return (
              <ChannelControls
                key={channelId}
                channelId={channelId}
                isMuted={mute}
                isOutput={isOutput}
                level={level}
                limited={limited}
                group={group}
                name={name}
                selected={selected}
                index={index}
                onChange={onChange}
                onToggleChange={this.handleToggleChange}
              />
            );
          })}
        </div>
        <Button
          className="pull-left responsive-rotate-90"
          disabled={!isAnySelected}
          bsStyle={isAnySelected ? 'info' : 'default'}
          style={{
            margin: '8px 1px',
            width: '36px',
            height: '36px',
            padding: '8px'
          }}
          onClick={this.handleToggle}
        >
          <Glyphicon glyph="transfer" />
        </Button>
        <Button
          className="pull-left"
          id="mute-all"
          bsStyle={isAnyUnmuted ? 'default' : 'danger'}
          style={{
            width: '150px',
            height: '36px',
            margin: '8px 1px'
          }}
          onClick={() => this.handleMuteAll(isAnyUnmuted)}
        >
          <Glyphicon glyph={isAnyUnmuted ? 'volume-up' : 'volume-off'} />
        </Button>
      </div>
    );
  }
}

export default ChannelLevels;
