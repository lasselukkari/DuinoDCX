import React, { PureComponent } from 'react';
import FormLabel from 'react-bootstrap/FormLabel';
import pc, { type ChangeEventArgs } from './parameters/index.tsx';

type GainProps = {
  readonly channelName?: string;
  readonly gain?: number | string;
  readonly group: string;
  readonly channelId: number | string;
  readonly onChange: (args: ChangeEventArgs) => void;
};

class Gain extends PureComponent<GainProps> {
  static defaultProps = {
    channelName: null,
    gain: undefined,
  };

  render() {
    const { channelName, gain, group, channelId, onChange } = this.props;

    return (
      <div>
        <FormLabel className="form-header" style={{ marginBottom: '5px', display: 'block' }}>
          {`Channel ${channelName}`}
        </FormLabel>
        <pc.Gain
          value={gain}
          group={group}
          channelId={channelId as string}
          onChange={onChange}
        />
      </div>
    );
  }
}

export default Gain;
