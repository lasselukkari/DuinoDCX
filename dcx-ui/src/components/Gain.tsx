import FormLabel from 'react-bootstrap/FormLabel';
import {
  input,
  output,
  type InputId,
  type OutputId,
} from '@/components/parameters/index.tsx';

type GainProps = {
  readonly channelName?: string;
  readonly gain: number;
  readonly group: 'inputs' | 'outputs';
  readonly channelId: string;
};

function Gain({channelName, gain, group, channelId}: GainProps) {
  return (
    <div>
      <FormLabel
        className="form-header"
        style={{marginBottom: '5px', display: 'block'}}
      >
        {channelName ? `${channelId}. ${channelName}` : `Channel ${channelId}`}
      </FormLabel>
      {group === 'inputs' ? (
        <input.Gain value={gain ?? 0} id={channelId as InputId} />
      ) : (
        <output.Gain value={gain ?? 0} id={channelId as OutputId} />
      )}
    </div>
  );
}

export default Gain;
