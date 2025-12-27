import React, {useMemo} from 'react';
import Card from 'react-bootstrap/Card';
import isEqual from 'lodash.isequal';
import BlockUi from './components/block-ui.tsx';
import Eq from './eq.tsx';
import EqPlot from './plots/eq-plot.tsx';
import pc from './parameters/index.tsx';
import {type Channel, type EQ} from './dcx2496/parser.ts';

type ChangeEventArgs = {
  param: string;
  group?: string;
  channelId?: string;
  eq?: string;
  value: boolean | number | string;
};

type Props = {
  readonly channelId: string;

  readonly group: string;

  readonly channel: Channel;

  readonly isBlocking: boolean;

  readonly onChange: (args: ChangeEventArgs) => void;
};

function EqList({
  channelId,
  group,
  channel = {eqs: {}, isEqOn: false, channelName: ''},
  isBlocking,
  onChange,
}: Props) {
  const {eqs, isEqOn} = channel;

  const activeEqs = useMemo(() => {
    const eqsKeys = Object.keys(eqs).sort();
    const result: Array<EQ & {id: string}> = [];
    let activeFound = false;

    for (let i = eqsKeys.length - 1; i >= 0; i--) {
      const gain = eqs[eqsKeys[i]].eQGain;
      if (!activeFound && gain && gain !== 0) {
        if (eqs[eqsKeys[i + 1]]) {
          result.push({id: eqsKeys[i + 1], ...eqs[eqsKeys[i + 1]]});
        }

        activeFound = true;
      }

      if (activeFound) {
        result.unshift({id: eqsKeys[i], ...eqs[eqsKeys[i]]});
      }
    }

    if (!activeFound && eqsKeys.length > 0) {
      result.push({id: eqsKeys[0], ...eqs[eqsKeys[0]]});
    }

    return result;
  }, [eqs]);

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
          <EqPlot channels={{[channelId]: channel}} />
        </Card.Body>
      </Card>
      <BlockUi blocking={isBlocking}>
        <Card>
          <Card.Header>
            {channel.channelName
              ? `${channelId}. ${channel.channelName} Equalizer`
              : `Input ${channelId} Equalizer`}
          </Card.Header>
          <Card.Body>
            <pc.IsEQOn
              isTrue={isEqOn}
              group={group}
              channelId={channelId}
              onChange={onChange}
            />
          </Card.Body>
        </Card>
        {activeEqs.map((eq) => {
          const {eQType, eQFrequency, eQQ, eQShelving, eQGain} = eq;
          return (
            <Eq
              key={group + channelId + eq.id}
              group={group}
              id={eq.id}
              channelId={channelId}
              eQType={eQType}
              eQFrequency={eQFrequency}
              eQQ={eQQ}
              eQShelving={eQShelving}
              eQGain={eQGain}
              onChange={onChange}
            />
          );
        })}
      </BlockUi>
    </div>
  );
}

export default React.memo(EqList, (previousProps, nextProps) => {
  return (
    previousProps.isBlocking === nextProps.isBlocking &&
    isEqual(previousProps.channel, nextProps.channel)
  );
});
