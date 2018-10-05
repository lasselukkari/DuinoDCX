import React, {Component, PureComponent} from 'react';
import {Panel, Button, Clearfix, Glyphicon} from 'react-bootstrap';
import BlockUi from 'react-block-ui';
import isEqual from 'lodash.isequal';

import Gains from './Gains';

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
    const {isMuted, channelName, channelId, isOutput} = this.props;

    const muteStyle = {
      display: 'block',
      margin: '1px',
      width: '38px',
      height: '36px'
    };
    const labelInStyle = {
      display: 'block',
      margin: '1px',
      width: '38px',
      height: '36px',
      padding: '2px',
      background: '#111'
    };
    const labelOutStyle = {
      display: 'block',
      margin: '1px',
      width: '38px',
      height: '36px',
      padding: '2px',
      background: '#444'
    };

    let channelAbbrName = String(channelName);
    channelAbbrName = channelAbbrName.match(/\b\w/g).join('');

    return (
      <div>
        <Button
          bsStyle={isMuted ? 'danger' : 'default'}
          title={
            isMuted
              ? 'Channel is muted. Push to unmute.'
              : 'Channel is unmuted. Push to mute.'
          }
          style={muteStyle}
          onClick={this.handleClick}
        >
          <Glyphicon glyph={isMuted ? 'volume-off' : 'volume-up'} />
        </Button>
        <Button
          style={isOutput ? labelOutStyle : labelInStyle}
          title={isOutput ? channelName : 'Input ' + channelId}
        >
          {isOutput ? channelAbbrName : channelId}
        </Button>
      </div>
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
      display: 'block',
      margin: '2px',
      cursor: 'default',
      width: '38px',
      height: '16px'
    };

    return (
      <div>
        {isOutput && (
          <Button
            bsStyle={limited ? 'danger' : 'default'}
            disabled={!limited}
            style={style}
          />
        )}
        <Button
          bsStyle={level >= 6 ? 'danger' : 'default'}
          disabled={level < 6}
          style={style}
        />
        <Button
          bsStyle={level >= 5 ? 'warning' : 'default'}
          disabled={level < 5}
          style={style}
        />
        <Button
          bsStyle={level >= 4 ? 'success' : 'default'}
          disabled={level < 4}
          style={style}
        />
        <Button
          bsStyle={level >= 3 ? 'success' : 'default'}
          disabled={level < 3}
          style={style}
        />
        <Button
          bsStyle={level >= 2 ? 'success' : 'default'}
          disabled={level < 2}
          style={style}
        />
        <Button
          bsStyle={level >= 1 ? 'success' : 'default'}
          disabled={level < 1}
          style={style}
        />
      </div>
    );
  }
}

class ChannelControls extends PureComponent {
  render() {
    const {
      limited,
      level,
      onChange,
      channelId,
      isOutput,
      isMuted,
      channelName
    } = this.props;

    return (
      <div>
        <ChannelLevel
          key={'level-' + channelId}
          channelId={channelId}
          isMuted={isMuted}
          isOutput={isOutput}
          limited={limited}
          level={level}
          onChange={onChange}
        />
        <MuteButton
          key={'mute-' + channelId}
          channelId={channelId}
          isMuted={isMuted}
          isOutput={isOutput}
          channelName={channelName}
          onChange={onChange}
        />
      </div>
    );
  }
}

class ChannelLevels extends Component {
  shouldComponentUpdate(nextProps) {
    const {blocking, device} = this.props;
    return !(
      nextProps.blocking === blocking && isEqual(nextProps.device, device)
    );
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

  handleMuteOutputs = value => {
    const {onChange} = this.props;

    const outputs = outputChannels.map(channelId => ({
      param: 'mute',
      group: 'outputs',
      channelId,
      value
    }));

    onChange(outputs);
  };

  render() {
    const {device, onChange, blocking} = this.props;
    const {inputs, outputs, state} = device;
    const {channels} = state;
    const isAnyUnmuted =
      inputChannels.some(channel => !inputs[channel].mute) ||
      outputChannels.some(channel => !outputs[channel].mute);
    const isAnyOutputUnmuted = outputChannels.some(
      channel => !outputs[channel].mute
    );

    return (
      <div>
        <h2>Channel Levels</h2>
        <hr />
        <BlockUi blocking={blocking}>
          <div className="channels-container">
            <div className="channel-group">
              {inputChannels.map(channelId => {
                const {limited, level} = channels[channelId];
                const {mute, channelName} = inputs[channelId];
                return (
                  <ChannelControls
                    key={channelId}
                    channelId={channelId}
                    isMuted={mute}
                    limited={limited}
                    level={level}
                    channelName={channelName}
                    onChange={onChange}
                  />
                );
              })}
            </div>
            <div className="channel-group">
              {outputChannels.map(channelId => {
                const {limited, level} = channels[channelId];
                const {mute, channelName} = outputs[channelId];
                const isOutput = true;
                return (
                  <ChannelControls
                    key={channelId}
                    channelId={channelId}
                    isMuted={mute}
                    isOutput={isOutput}
                    level={level}
                    limited={limited}
                    channelName={channelName}
                    onChange={onChange}
                  />
                );
              })}
            </div>
            <Clearfix />
            <br />
            <Button
              className="center-block"
              bsStyle={isAnyUnmuted ? 'default' : 'danger'}
              style={{width: '110px'}}
              onClick={() => this.handleMuteAll(isAnyUnmuted)}
            >
              {isAnyUnmuted ? 'Mute All' : 'Unmute All'}
            </Button>
            <Button
              className="center-block"
              bsStyle={isAnyOutputUnmuted ? 'default' : 'danger'}
              style={{width: '110px'}}
              onClick={() => this.handleMuteOutputs(isAnyOutputUnmuted)}
            >
              {isAnyOutputUnmuted ? 'Mute Outs' : 'Unmute Outs'}
            </Button>
          </div>
          <Panel>
            <Panel.Heading>Input Gains</Panel.Heading>
            <Panel.Body>
              <Gains
                group="inputs"
                channels={inputs}
                xs={12}
                sm={12}
                md={12}
                onChange={onChange}
              />
            </Panel.Body>
          </Panel>
          <Panel>
            <Panel.Heading>Output Gains</Panel.Heading>
            <Panel.Body>
              <Gains
                group="outputs"
                channels={outputs}
                xs={12}
                sm={12}
                md={12}
                onChange={onChange}
              />
            </Panel.Body>
          </Panel>
        </BlockUi>
      </div>
    );
  }
}

export default ChannelLevels;
