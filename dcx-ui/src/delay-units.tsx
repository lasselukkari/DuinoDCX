import React, {useState} from 'react';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';

type Props = {
  readonly delayUnits: string;
  readonly onChange: (args: any) => void;
};

function DelayUnits({delayUnits: initialDelayUnits, onChange}: Props) {
  const [delayUnits, setDelayUnits] = useState(initialDelayUnits);

  const handleDelayUnitChange = (value: string) => {
    // ToggleButtonGroup onChange returns value (string/number/array) directly.
    setDelayUnits(value);
    onChange({param: 'delayUnits', value});
  };

  return (
    <ToggleButtonGroup
      type="radio"
      name="delay-units"
      value={delayUnits} // Controlled component
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

export default React.memo(DelayUnits);
