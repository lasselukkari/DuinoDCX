import FormLabel from 'react-bootstrap/FormLabel';
import {output, type OutputId} from '@/components/parameters/index.tsx';

type Props = {
  readonly channelId: string;
  readonly channelName: string;
};

function ChannelName({channelName, channelId}: Props) {
  return (
    <div>
      <FormLabel>
        {channelName ? channelId + '. ' + channelName : channelId}
      </FormLabel>
      <output.ChannelName value={channelName} id={channelId as OutputId} />
    </div>
  );
}

export default ChannelName;
