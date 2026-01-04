import Button from 'react-bootstrap/Button';
import {FaVolumeMute, FaVolumeUp} from 'react-icons/fa';
import {useSendCommand} from './hooks/use-send-command.js';

type Props = {
  readonly isMuted: boolean;
  readonly channelId: string;
  readonly isOutput: boolean;
};

function MuteButton({isMuted, channelId, isOutput}: Props) {
  const sendCommand = useSendCommand();
  const handleClick = () => {
    void sendCommand({
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

export default MuteButton;
