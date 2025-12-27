import React, {PureComponent} from 'react';
import FormLabel from 'react-bootstrap/FormLabel';
import pc, {type ChangeEventArgs} from './parameters/index.tsx';

type OutputSourceProps = {
  readonly channelName?: string;
  readonly source?: number | string;
  readonly channelId: number | string;
  readonly onChange: (args: ChangeEventArgs) => void;
  readonly group: string;
};

class OutputSource extends PureComponent<OutputSourceProps> {
  static defaultProps = {
    channelName: undefined,
    source: undefined,
  };

  render() {
    const {channelName, source, channelId, onChange, group} = this.props;
    return (
      <div>
        <FormLabel>
          {channelName ? channelId + '. ' + channelName : channelId}
        </FormLabel>
        <pc.Source
          value={source}
          group={group}
          channelId={channelId as string}
          onChange={onChange}
        />
      </div>
    );
  }
}

export default OutputSource;
