import FormLabel from 'react-bootstrap/FormLabel';
import pc from './parameters/index.tsx';

type OutputSourceProps = {
  readonly channelName?: string;
  readonly source?: number | string;
  readonly channelId: string;
  readonly group: string;
};

function OutputSource({
  channelName,
  source,
  channelId,
  group,
}: OutputSourceProps) {
  return (
    <div>
      <FormLabel>
        {channelName ? channelId + '. ' + channelName : channelId}
      </FormLabel>
      <pc.Source value={source} group={group} channelId={channelId} />
    </div>
  );
}

export default OutputSource;
