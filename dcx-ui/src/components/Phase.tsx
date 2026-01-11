import Card from 'react-bootstrap/Card';
import {output, type OutputId} from '@/components/parameters/index.tsx';

type PhaseProps = {
  readonly channelName?: string;
  readonly polarity: string;
  readonly phase: number;
  readonly channelId: string;
};

function Phase({channelName, polarity, phase, channelId}: PhaseProps) {
  const id = channelId as OutputId;

  return (
    <Card>
      <Card.Header>
        {channelName ? `${channelId}. ${channelName}` : `Channel ${channelId}`}
      </Card.Header>
      <Card.Body>
        <output.Polarity hasLabel value={polarity} id={id} />
        <output.Phase hasLabel value={phase} id={id} />
      </Card.Body>
    </Card>
  );
}

export default Phase;
