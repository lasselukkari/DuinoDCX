import React, {Component, PureComponent} from 'react';
import {Panel, Button, Clearfix, Glyphicon} from 'react-bootstrap';
import BlockUi from 'react-block-ui';
import isEqual from 'lodash.isequal';

import Gains from './Gains';

import './ChannelLevels.css'; // eslint-disable-line import/no-unassigned-import

class MuteButton extends PureComponent {

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

class ChannelLevel extends PureComponent {
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
          onChange={onChange}
          isMuted={isMuted}
          isOutput={isOutput}
          limited={limited}
          level={level}
        />
        <MuteButton
          key={'mute-' + channelId}
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

  handleMuteAll = () => { // eslint-disable-line no-undef
    const {onChange} = this.props;

    const inputs = ['A', 'B', 'C']
      .map(channelId => ({param: 'mute', group: 'inputs', channelId, value: true}));
    const outputs = ['1', '2', '3', '4', '5', '6']
      .map(channelId => ({param: 'mute', group: 'outputs', channelId, value: true}));

    onChange(inputs.concat(outputs));
  };

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
                const {limited, level} = device.state.channels[channelId];
                return (
                  <ChannelControls
                    key={channelId}
                    onChange={onChange}
                    channelId={channelId}
                    isMuted={inputs[channelId].mute}
                    limited={limited}
                    level={level}
                  />
                );
              })}
            </div>
            <div className="channel-group">
              {['1', '2', '3', '4', '5', '6'].map(channelId => {
                const {limited, level} = device.state.channels[channelId];
                return (
                  <ChannelControls
                    key={channelId}
                    onChange={onChange}
                    channelId={channelId}
                    isMuted={outputs[channelId].mute}
                    limited={limited}
                    level={level}
                    isOutput
                  />
                );
              })}
            </div>
            <Clearfix/>
            <br/>
            <Button className="center-block" onClick={this.handleMuteAll}>
Mute All
            </Button>
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
