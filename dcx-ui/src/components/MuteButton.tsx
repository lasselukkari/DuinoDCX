import Button from 'react-bootstrap/Button';
import {FaVolumeMute, FaVolumeUp} from 'react-icons/fa';
import {useSendCommand} from '@/hooks/useSendCommand.js';

type Props = {
  readonly isMuted: boolean;
  readonly channelId: string;
  readonly isOutput: boolean;
};

function MuteButton({isMuted, channelId, isOutput}: Props) {
  const sendCommand = useSendCommand();
  const handleClick = () => {
    void sendCommand(
      {
        kind: 'channel',
        group: isOutput ? 'outputs' : 'inputs',
        id: channelId,
        key: 'mute',
      },
      !isMuted,
    );
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
