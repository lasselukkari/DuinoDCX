import React, {PureComponent} from 'react';
import Card from 'react-bootstrap/Card';
import pc, {type ChangeEventArgs} from './parameters/index.tsx';

type PhaseProps = {
  readonly channelName?: string | undefined;
  readonly polarity: boolean | number | string;
  readonly phase: boolean | number | string;
  readonly channelId: string | number;
  readonly group: string;
  readonly onChange: (args: ChangeEventArgs) => void;
};

class Phase extends PureComponent<PhaseProps> {
  static defaultProps = {
    channelName: undefined,
  };

  render() {
    const {channelName, polarity, phase, channelId, onChange, group} =
      this.props;

    return (
      <Card>
        <Card.Header>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Card.Header>
        <Card.Body>
          <pc.Polarity
            hasLabel
            value={polarity}
            group={group}
            channelId={channelId as string}
            onChange={onChange}
          />
          <pc.Phase
            hasLabel
            value={phase}
            group={group}
            channelId={channelId as string}
            onChange={onChange}
          />
        </Card.Body>
      </Card>
    );
  }
}

export default Phase;
