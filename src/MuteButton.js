import React, {PureComponent} from 'react';
import {Button} from 'react-bootstrap';
import {FaVolumeMute, FaVolumeUp} from 'react-icons/fa';

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
      padding: '0px'
    };

    return (
      <Button
        className="responsive-rotate-90"
        variant={isMuted ? 'danger' : 'dark'}
        style={muteStyle}
        onClick={this.handleClick}
      >
        {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
      </Button>
    );
  }
}

export default MuteButton;
