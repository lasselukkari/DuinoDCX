import Card from 'react-bootstrap/Card';
import BlockUi from './components/block-ui.tsx';
import Equalizer from './equalizer.tsx';
import EqualizerPlot from './plots/equalizer-plot.tsx';
import pc from './parameters/index.tsx';
import { type Channel, type EQ } from './dcx2496/parser.ts';

type Props = {
  readonly channelId: string;
  readonly group: string;
  readonly channel: Channel;
  readonly isBlocking: boolean;
};

function EqualizerList({ channel, group, channelId, isBlocking }: Props) {
  const { eqs, isEQOn } = channel;
  const eqsKeys = Object.keys(eqs).sort();
  const activeEQs: Array<EQ & { id: string }> = [];
  let activeFound = false;

  for (let i = eqsKeys.length - 1; i >= 0; i--) {
    const eq = eqs[eqsKeys[i]];
    const gain = eq.eQGain;
    if (!activeFound && gain && gain !== 0) {
      if (eqs[eqsKeys[i + 1]]) {
        activeEQs.push({ id: eqsKeys[i + 1], ...eqs[eqsKeys[i + 1]] });
      }

      activeFound = true;
    }

    if (activeFound) {
      activeEQs.unshift({ id: eqsKeys[i], ...eqs[eqsKeys[i]] });
    }
  }

  if (!activeFound) {
    activeEQs.push({ id: eqsKeys[0], ...eqs[eqsKeys[0]] });
  }

  return (
    <div>
      <Card>
        <Card.Header>
          {`Frequency Response: ${channel.channelName
              ? `${channel.channelName}`
              : `Input ${channelId}`
            }`}
        </Card.Header>
        <Card.Body>
          <EqualizerPlot channels={{ [channelId]: channel }} />
        </Card.Body>
      </Card>
      <BlockUi isBlocking={isBlocking}>
        <Card>
          <Card.Header>
            {channel.channelName
              ? `${channelId}. ${channel.channelName} Equalizer`
              : `Input ${channelId} Equalizer`}
          </Card.Header>
          <Card.Body>
            <pc.IsEQOn value={isEQOn ?? false} group={group} channelId={channelId} />
          </Card.Body>
        </Card>
        {activeEQs.map((eq) => {
          return (
            <Equalizer
              key={eq.id}
              id={eq.id}
              group={group}
              channelId={channelId}
              eQType={eq.eQType || 'Low Shelv'}
              eQFrequency={eq.eQFrequency ?? 20}
              eQQ={eq.eQQ ?? 0.1}
              eQShelving={eq.eQShelving || '6dB'}
              eQGain={eq.eQGain ?? 0}
            />
          );
        })}
      </BlockUi>
    </div>
  );
}

export default EqualizerList;
