import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {Button} from 'react-bootstrap';
import {FaRandom, FaVolumeUp, FaVolumeMute} from 'react-icons/fa';
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
    const {device, inputs, outputs, onChange} = this.props;

    if (!device || !device.ready || !inputs || !outputs) {
      return null;
    }

    const isAnyUnmuted =
      inputChannels.some(channel => !device.inputs[channel].mute) ||
      outputChannels.some(channel => !device.outputs[channel].mute);

    const isAnySelected =
      this.state.selected.inputs.some(channel => channel.selected) ||
      this.state.selected.outputs.some(channel => channel.selected);

    return (
      <div className="channels-container">
        <div className="channel-group">
          {inputChannels.map((channelId, index) => {
            const {limited, level} = inputs[index];
            const {mute} = device.inputs[channelId];
            const {group, name, selected} = this.state.selected.inputs[index];

            return (
              <ChannelControls
                key={channelId}
                channelId={channelId}
                isOutput={false}
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
            const {limited, level} = outputs[index];
            const {mute} = device.outputs[channelId];
            const {group, name, selected} = this.state.selected.outputs[index];

            return (
              <ChannelControls
                key={channelId}
                isOutput
                isMuted={mute}
                group={group}
                level={level}
                limited={limited}
                channelId={channelId}
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

ChannelLevels.propTypes = {
  device: PropTypes.shape({
    ready: PropTypes.bool.isRequired,
    inputs: PropTypes.object,
    outputs: PropTypes.object
  }).isRequired,
  inputs: PropTypes.arrayOf(
    PropTypes.shape({
      limited: PropTypes.bool.isRequired,
      level: PropTypes.number.isRequired
    })
  ).isRequired,
  outputs: PropTypes.arrayOf(
    PropTypes.shape({
      limited: PropTypes.bool.isRequired,
      level: PropTypes.number.isRequired
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired
};

export default ChannelLevels;
