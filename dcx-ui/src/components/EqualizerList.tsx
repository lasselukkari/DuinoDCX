import Card from 'react-bootstrap/Card';
import {
  type Equalizer as EqualizerType,
  type Channel,
  isOutputChannel,
} from 'dcx-parser';
import BlockUi from '@/components/BlockUi.js';
import Equalizer from '@/components/Equalizer.js';
import EqualizerPlot from '@/components/plots/EqualizerPlot.js';
import {
  input,
  output,
  type InputId,
  type OutputId,
} from '@/components/parameters/index.js';

type Props = {
  readonly channelId: string;
  readonly group: 'inputs' | 'outputs';
  readonly channel: Channel;
  readonly isBlocking: boolean;
};

function EqualizerList({channel, group, channelId, isBlocking}: Props) {
  const {equalizers, isEqualizerOn} = channel;
  const eqsKeys = Object.keys(equalizers).sort();
  const activeEQs: Array<EqualizerType & {id: string}> = [];
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
            isOutputChannel(channel)
              ? channel.channelName
              : `Channel ${channelId}`
          }`}
        </Card.Header>
        <Card.Body>
          <EqualizerPlot channels={{[channelId]: channel}} />
        </Card.Body>
      </Card>
      <BlockUi isBlocking={isBlocking}>
        <Card>
          <Card.Header>
            {isOutputChannel(channel)
              ? `${channelId}. ${channel.channelName} Equalizer`
              : `Channel ${channelId} Equalizer`}
          </Card.Header>
          <Card.Body>
            {group === 'inputs' ? (
              <input.IsEqualizerOn
                value={isEqualizerOn ?? false}
                id={channelId as InputId}
              />
            ) : (
              <output.IsEqualizerOn
                value={isEqualizerOn ?? false}
                id={channelId as OutputId}
              />
            )}
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
              equalizerFrequency={eq.equalizerFrequency ?? '20'}
              equalizerQ={eq.equalizerQ ?? '0.1'}
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
