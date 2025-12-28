import Card from 'react-bootstrap/Card';
import pc from './parameters/index.tsx';

type PhaseProps = {
  readonly channelName?: string;
  readonly polarity: boolean | number | string;
  readonly phase: boolean | number | string;
  readonly channelId: string;
  readonly group: string;
};

function Phase({channelName, polarity, phase, channelId, group}: PhaseProps) {
  return (
    <Card>
      <Card.Header>
        {channelName ? `${channelId} . ${channelName}` : `Channel ${channelId}`}
      </Card.Header>
      <Card.Body>
        <pc.Polarity
          hasLabel
          value={polarity}
          group={group}
          channelId={channelId}
        />
        <pc.Phase hasLabel value={phase} group={group} channelId={channelId} />
      </Card.Body>
    </Card>
  );
}

export default Phase;
