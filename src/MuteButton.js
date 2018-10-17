import React, {PureComponent} from 'react';
import {Button, Glyphicon} from 'react-bootstrap';

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
      padding: '8px'
    };

    return (
      <Button
        className="responsive-rotate-90"
        bsStyle={isMuted ? 'danger' : 'default'}
        style={muteStyle}
        onClick={this.handleClick}
      >
        <Glyphicon glyph={isMuted ? 'volume-off' : 'volume-up'} />
      </Button>
    );
  }
}

export default MuteButton;
