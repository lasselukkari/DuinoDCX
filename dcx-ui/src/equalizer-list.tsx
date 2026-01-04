import Card from 'react-bootstrap/Card';
import BlockUi from './components/block-ui.js';
import Equalizer from './equalizer.js';
import EqualizerPlot from './plots/equalizer-plot.js';
import pc from './parameters/index.js';
import type { type Channel, type Equalizer } from 'dcx-parser';

type Props = {
  readonly channelId: string;
  readonly group: string;
  readonly channel: Channel;
  readonly isBlocking: boolean;
};

function EqualizerList({channel, group, channelId, isBlocking}: Props) {
  const {equalizers, isEqualizerOn} = channel;
  const eqsKeys = Object.keys(equalizers).sort();
  const activeEQs: Array<Equalizer & {id: string}> = [];
  let activeFound = false;

  for (let i = eqsKeys.length - 1; i >= 0; i--) {
    const eq = equalizers[eqsKeys[i]];
    const gain = eq.equalizerGain;
    if (!activeFound && gain && gain !== 0) {
      if (equalizers[eqsKeys[i + 1]]) {
        activeEQs.push({id: eqsKeys[i + 1], ...equalizers[eqsKeys[i + 1]]});
      }

      activeFound = true;
    }

    if (activeFound) {
      activeEQs.unshift({id: eqsKeys[i], ...equalizers[eqsKeys[i]]});
    }
  }

  if (!activeFound) {
    activeEQs.push({id: eqsKeys[0], ...equalizers[eqsKeys[0]]});
  }

  return (
    <div>
      <Card>
        <Card.Header>
          {`Frequency Response: ${
            channel.channelName
              ? `${channel.channelName}`
              : `Input ${channelId}`
          }`}
        </Card.Header>
        <Card.Body>
          <EqualizerPlot channels={{[channelId]: channel}} />
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
            <pc.IsEqualizerOn
              value={isEqualizerOn ?? false}
              group={group}
              channelId={channelId}
            />
          </Card.Body>
        </Card>
        {activeEQs.map((eq) => {
          return (
            <Equalizer
              key={eq.id}
              id={eq.id}
              group={group}
              channelId={channelId}
              equalizerType={eq.equalizerType ?? 'Low Shelv'}
              equalizerFrequency={eq.equalizerFrequency ?? 20}
              equalizerQ={eq.equalizerQ ?? 0.1}
              equalizerShelving={eq.equalizerShelving ?? '6dB'}
              equalizerGain={eq.equalizerGain ?? 0}
            />
          );
        })}
      </BlockUi>
    </div>
  );
}

export default EqualizerList;
