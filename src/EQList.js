import React, {Component} from 'react';
import BlockUi from 'react-block-ui';
import isEqual from 'lodash.isequal';
import pc from './parameters';
import EQ from './EQ';

class EQs extends Component {
  shouldComponentUpdate(nextProps) {
    const {channel, blocking} = this.props;
    return !isEqual(channel, nextProps.channel) || blocking !== nextProps.blocking;
  }

  render() {
    const {channel, group, channelId, onChange, blocking} = this.props;
    const {eqs, eQ} = channel;
    const eqsKeys = Object.keys(eqs).sort();
    const activeEQs = [];
    let activeFound = false;

    for (let i = eqsKeys.length - 1; i >= 0; i--) {
      const gain = eqs[eqsKeys[i]].eQGain;
      if (!activeFound && gain && gain !== 0) {
        if (eqs[eqsKeys[i + 1]]) {
          activeEQs.push({id: eqsKeys[i + 1], ...eqs[eqsKeys[i + 1]]});
        }

        activeFound = true;
      }

      if (activeFound) {
        activeEQs.unshift({id: eqsKeys[i], ...eqs[eqsKeys[i]]});
      }
    }

    if (!activeFound) {
      activeEQs.push({id: eqsKeys[0], ...eqs[eqsKeys[0]]});
    }

    return (
      <BlockUi blocking={blocking}>
        <br/>
        <pc.EQ
          value={eQ}
          group={group}
          channelId={channelId}
          onChange={onChange}
        />

        {activeEQs.map(eq => (
          <EQ
            key={group + channelId + eq.id}
            onChange={onChange}
            group={group}
            eq={eq}
            id={eq.id}
            channelId={channelId}
          />
        ))}
      </BlockUi>
    );
  }
}

export default EQs;
