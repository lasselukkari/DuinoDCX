import FormLabel from 'react-bootstrap/FormLabel';
import pc from './parameters/index.tsx';

type Props = {
  readonly group: string;
  readonly channelId: string;
  readonly channelName: string;
};

function ChannelName({channelName, channelId, group}: Props) {
  return (
    <div>
      <FormLabel>
        {channelName ? channelId + '. ' + channelName : channelId}
      </FormLabel>
      <pc.ChannelName value={channelName} group={group} channelId={channelId} />
    </div>
  );
}

export default ChannelName;
