import FormLabel from 'react-bootstrap/FormLabel';
import {output, type OutputId} from '@/components/parameters/index.tsx';

type OutputSourceProps = {
  readonly channelName?: string;
  readonly source: string;
  readonly channelId: string;
};

function OutputSource({channelName, source, channelId}: OutputSourceProps) {
  return (
    <div>
      <FormLabel>
        {channelName ? channelId + '. ' + channelName : channelId}
      </FormLabel>
      <output.Source value={source ?? ''} id={channelId as OutputId} />
    </div>
  );
}

export default OutputSource;
