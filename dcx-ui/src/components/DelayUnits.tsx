import {memo} from 'react';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import {useSendCommand} from '@/hooks/useSendCommand.js';

type Props = {
  readonly delayUnits: string;
};

function DelayUnits({delayUnits}: Props) {
  const sendCommand = useSendCommand();

  const handleDelayUnitChange = (value: string) => {
    void sendCommand({kind: 'setup', key: 'delayUnits'}, value);
  };

  return (
    <ToggleButtonGroup
      type="radio"
      name="delay-units"
      value={delayUnits}
      style={{padding: '10px 0', width: '100%'}}
      onChange={handleDelayUnitChange}
    >
      <ToggleButton
        id="unit-mm"
        value="mm"
        variant={delayUnits === 'mm' ? 'info' : 'primary'}
        style={{width: '50%'}}
      >
        °C / mm
      </ToggleButton>
      <ToggleButton
        id="unit-inch"
        value="inch"
        variant={delayUnits === 'inch' ? 'info' : 'primary'}
        style={{width: '50%'}}
      >
        °F / inch
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

export default memo(DelayUnits);
