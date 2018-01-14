import React, {Component} from 'react';
import {Panel, Button, Clearfix, Glyphicon} from 'react-bootstrap';
import BlockUi from 'react-block-ui';
import isEqual from 'lodash.isequal';

import Gains from './Gains';

import './ChannelLevels.css'; // eslint-disable-line import/no-unassigned-import

class MuteButton extends Component {
  shouldComponentUpdate(nextProps) {
    const {isMuted} = this.props;
    return isMuted !== nextProps.isMuted;
  }

  handleClick = () => { // eslint-disable-line no-undef
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
      display: 'block',
      margin: '1px',
      width: '38px',
      height: '36px'
    };

    return (
      <Button
        bsStyle={isMuted ? 'danger' : 'default'}
        style={muteStyle}
        onClick={this.handleClick}
      >
        <Glyphicon glyph={isMuted ? 'volume-off' : 'volume-up'}/>
      </Button>

    );
  }
}

class ChannelLevel extends Component {
  shouldComponentUpdate(nextProps) {
    const {channel} = this.props;
    return !isEqual(channel, nextProps.channel);
  }

  handleClick = () => { // eslint-disable-line no-undef
    const {channelId, isMuted, isOutput, onChange} = this.props;
    onChange({
      param: 'mute',
      group: isOutput ? 'outputs' : 'inputs',
      channelId,
      value: !isMuted
    });
  };

  render() {
    const {channel = {}, isOutput} = this.props;
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
            bsStyle={channel.limited ? 'danger' : 'default'}
            disabled={!channel.limited}
            style={style}
          />
        )}
        <Button
          bsStyle={channel.level >= 7 ? 'danger' : 'default'}
          disabled={channel.level < 7}
          style={style}
        />
        <Button
          bsStyle={channel.level >= 6 ? 'warning' : 'default'}
          disabled={channel.level < 6}
          style={style}
        />
        <Button
          bsStyle={channel.level >= 5 ? 'success' : 'default'}
          disabled={channel.level < 5}
          style={style}
        />
        <Button
          bsStyle={channel.level >= 4 ? 'success' : 'default'}
          disabled={channel.level < 4}
          style={style}
        />
        <Button
          bsStyle={channel.level >= 3 ? 'success' : 'default'}
          disabled={channel.level < 3}
          style={style}
        />
        <Button
          bsStyle={channel.level >= 2 ? 'success' : 'default'}
          disabled={channel.level < 2}
          style={style}
        />
        <Button
          bsStyle={channel.level >= 1 ? 'success' : 'default'}
          disabled={channel.level < 1}
          style={style}
        />
      </div>
    );
  }
}

class ChannelControls extends Component {
  render() {
    const {channel, onChange, channelId, isOutput, isMuted} = this.props;

    return (
      <div>
        <ChannelLevel
          key={'level-' + channelId}
          channel={channel}
          channelId={channelId}
          onChange={onChange}
          isMuted={isMuted}
          isOutput={isOutput}
        />
        <MuteButton
          key={'mute-' + channelId}
          channel={channel}
          channelId={channelId}
          onChange={onChange}
          isMuted={isMuted}
          isOutput={isOutput}
        />
      </div>
    );
  }
}

class ChannelLevels extends Component {
  shouldComponentUpdate(nextProps) {
    const {blocking, device} = this.props;
    return !(
      nextProps.blocking === blocking &&
      isEqual(nextProps.device, device)
    );
  }
  render() {
    const {device, onChange, blocking} = this.props;
    const {inputs, outputs} = device;

    return (
      <div>
        <h2>
Channel Levels
        </h2>
        <hr/>
        <BlockUi blocking={blocking}>
          <div className="channels-container">
            <div className="channel-group">
              {['A', 'B', 'C'].map(channelId => {
                return (
                  <ChannelControls
                    key={channelId}
                    channel={device.state.channels[channelId]}
                    onChange={onChange}
                    channelId={channelId}
                    isMuted={inputs[channelId].mute}
                  />
                );
              })}
            </div>
            <div className="channel-group">
              {['1', '2', '3', '4', '5', '6'].map(channelId => {
                return (
                  <ChannelControls
                    key={channelId}
                    channel={device.state.channels[channelId]}
                    onChange={onChange}
                    channelId={channelId}
                    isMuted={outputs[channelId].mute}
                    isOutput
                  />
                );
              })}
            </div>
            <Clearfix/>
          </div>
          <Panel header="Input Gains">
            <Gains
              onChange={onChange}
              group="inputs"
              channels={inputs}
              xs={12}
              sm={12}
              md={12}
            />
          </Panel>
          <Panel header="Output Gains">
            <Gains
              onChange={onChange}
              group="outputs"
              channels={outputs}
              xs={12}
              sm={12}
              md={12}
            />
          </Panel>
        </BlockUi>
      </div>
    );
  }
}

export default ChannelLevels;
