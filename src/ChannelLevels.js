import React, {Component, PureComponent} from 'react';
import {Button, Clearfix, Glyphicon} from 'react-bootstrap';
import isEqual from 'lodash.isequal';
import './ChannelLevels.css'; // eslint-disable-line import/no-unassigned-import

const inputChannels = ['A', 'B', 'C'];
const outputChannels = ['1', '2', '3', '4', '5', '6'];

class MuteButton extends PureComponent {
  handleClick = () => {
    const {channelId, isMuted, onChange, isOutput} = this.props;
    onChange({
      param: 'mute',
      group: isOutput ? 'outputs' : 'inputs',
      channelId,
      value: !isMuted
    });
  };

  render() {
    const {isMuted} = this.props;

    const muteStyle = {
      float: 'left',
      margin: '1px',
      width: '36px',
      height: '36px',
      padding: '5px'
    };

    return (
      <Button
        bsStyle={isMuted ? 'danger' : 'default'}
        style={muteStyle}
        onClick={this.handleClick}
      >
        <Glyphicon glyph={isMuted ? 'volume-off' : 'volume-up'} />
      </Button>
    );
  }
}

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
    const style = {
      margin: '1px',
      cursor: 'default',
      width: '14px',
      height: '36px',
      float: 'left',
      padding: '0'
    };

    return (
      <div style={{float: 'left'}}>
        <Button
          bsStyle={level >= 1 ? 'success' : 'default'}
          disabled={level < 1}
          style={style}
        />

        <Button
          bsStyle={level >= 2 ? 'success' : 'default'}
          disabled={level < 2}
          style={style}
        />

        <Button
          bsStyle={level >= 3 ? 'success' : 'default'}
          disabled={level < 3}
          style={style}
        />

        <Button
          bsStyle={level >= 4 ? 'success' : 'default'}
          disabled={level < 4}
          style={style}
        />

        <Button
          bsStyle={level >= 5 ? 'warning' : 'default'}
          disabled={level < 5}
          style={style}
        />

        <Button
          bsStyle={level >= 6 ? 'danger' : 'default'}
          disabled={level < 6}
          style={style}
        />

        {isOutput && (
          <Button
            bsStyle={limited ? 'danger' : 'default'}
            disabled={!limited}
            style={style}
          />
        )}
      </div>
    );
  }
}

class ChannelControls extends PureComponent {
  render() {
    const {limited, level, onChange, channelId, isOutput, isMuted} = this.props;

    return (
      <div>
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

class ChannelLevels extends Component {
  shouldComponentUpdate(nextProps) {
    const {device} = this.props;
    return !isEqual(nextProps.device, device);
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

    onChange(inputs.concat(outputs));
  };

  render() {
    const {device, onChange} = this.props;
    const {inputs, outputs, state} = device;
    const {channels} = state;
    const isAnyUnmuted =
      inputChannels.some(channel => !inputs[channel].mute) ||
      outputChannels.some(channel => !outputs[channel].mute);

    return (
      <div className="channels-container">
        <div className="channel-group">
          {inputChannels.map(channelId => {
            const {limited, level} = channels[channelId];
            const {mute} = inputs[channelId];
            return (
              <ChannelControls
                key={channelId}
                channelId={channelId}
                isMuted={mute}
                limited={limited}
                level={level}
                onChange={onChange}
              />
            );
          })}
        </div>
        <div className="channel-group">
          {outputChannels.map(channelId => {
            const {limited, level} = channels[channelId];
            const {mute} = outputs[channelId];
            const isOutput = true;
            return (
              <ChannelControls
                key={channelId}
                channelId={channelId}
                isMuted={mute}
                isOutput={isOutput}
                level={level}
                limited={limited}
                onChange={onChange}
              />
            );
          })}
        </div>
        <Clearfix />
        <Button
          className="center-block"
          id="mute-all"
          bsStyle={isAnyUnmuted ? 'default' : 'danger'}
          style={{width: '100%', marginTop: '10px'}}
          onClick={() => this.handleMuteAll(isAnyUnmuted)}
        >
          <Glyphicon glyph={isAnyUnmuted ? 'volume-up' : 'volume-off'} />
        </Button>
      </div>
    );
  }
}

export default ChannelLevels;
