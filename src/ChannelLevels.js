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
    const {limited, level, onChange, channelId, isOutput, isMuted} = this.props;

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

  render() {
    const {device, onChange, blocking} = this.props;
    const {inputs, outputs, state} = device;
    const {channels} = state;
    const isAnyUnmuted =
      inputChannels.some(channel => !inputs[channel].mute) ||
      outputChannels.some(channel => !outputs[channel].mute);

    return (
      <div>
        <h2>Channel Levels</h2>
        <hr />
        <BlockUi blocking={blocking}>
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
            <br />
            <Button
              className="center-block"
              bsStyle={isAnyUnmuted ? 'default' : 'danger'}
              style={{width: '100px'}}
              onClick={() => this.handleMuteAll(isAnyUnmuted)}
            >
              {isAnyUnmuted ? 'Mute All' : 'Unmute All'}
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
