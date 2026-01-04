import FormLabel from 'react-bootstrap/FormLabel';
import pc from './parameters/index.tsx';

type GainProps = {
  readonly channelName?: string;
  readonly gain?: number | string;
  readonly group: string;
  readonly channelId: number | string;
};

function Gain({channelName, gain, group, channelId}: GainProps) {
  return (
    <div>
      <FormLabel
        className="form-header"
        style={{marginBottom: '5px', display: 'block'}}
      >
        {`Channel ${channelName}`}
      </FormLabel>
      <pc.Gain
        value={gain ?? 0}
        group={group}
        channelId={channelId as string}
      />
    </div>
  );
}

export default Gain;
