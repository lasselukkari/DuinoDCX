import React, {Component} from 'react';
import BlockUi from 'react-block-ui';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import EQ from './EQ';
import EQPlot from './plots/EQPlot';
import pc from './parameters';

class EQs extends Component {
  static defaultProps = {
    channel: {
      channelName: null
    }
  };

  static propTypes = {
    channelId: PropTypes.string.isRequired,
    group: PropTypes.string.isRequired,
    channel: PropTypes.shape({
      eqs: PropTypes.object.isRequired,
      isEQOn: PropTypes.bool.isRequired,
      channelName: PropTypes.string
    }),
    isBlocking: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
  };

  shouldComponentUpdate(nextProps) {
    const {channel, isBlocking} = this.props;
    return (
      !isEqual(channel, nextProps.channel) ||
      isBlocking !== nextProps.isBlocking
    );
  }

  render() {
    const {channel, group, channelId, onChange, isBlocking} = this.props;
    const {eqs, isEQOn} = channel;
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
            <EQPlot channels={{[channelId]: channel}} />
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
                isTrue={isEQOn}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Card.Body>
          </Card>
          {activeEQs.map((eq) => {
            const {eQType, eQFrequency, eQQ, eQShelving, eQGain} = eq;
            return (
              <EQ
                key={group + channelId + eq.id}
                group={group}
                eq={eq}
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
}

export default EQs;
