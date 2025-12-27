import React from 'react';
import Button from 'react-bootstrap/Button';
import {FaVolumeMute, FaVolumeUp} from 'react-icons/fa';

type Props = {
  readonly isMuted: boolean;
  readonly channelId: string;
  readonly onChange: (args: any) => void;
  readonly isOutput: boolean;
};

function MuteButton({isMuted, channelId, onChange, isOutput}: Props) {
  const handleClick = () => {
    onChange({
      param: 'mute',
      group: isOutput ? 'outputs' : 'inputs',
      channelId,
      value: !isMuted,
    });
  };

  const muteStyle: React.CSSProperties = {
    float: 'left',
    margin: '1px',
    width: '36px',
    height: '36px',
    padding: '0px',
  };

  return (
    <Button
      className="responsive-rotate-90"
      variant={isMuted ? 'danger' : 'primary'}
      style={muteStyle}
      onClick={handleClick}
    >
      {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
    </Button>
  );
}

export default React.memo(MuteButton);
