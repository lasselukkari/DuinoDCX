import React from 'react';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';

type Props = {
  readonly onChange: (args: any) => void;
  readonly delayUnits: string;
  readonly airTemperature: number;
  readonly isDelayCorrectionOn: boolean;
};

function Temperature({
  onChange,
  delayUnits,
  airTemperature,
  isDelayCorrectionOn,
}: Props) {
  const handleValueChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    // FormControl onChange type for select element
    const {value} = event.target;
    const numericValue = Number(value);

    const unlocalizedValue =
      delayUnits === 'mm' ? numericValue : ((numericValue - 32) * 5) / 9;

    onChange({param: 'airTemperature', value: unlocalizedValue});
  };

  const handleCorrectionChange = () => {
    onChange({
      param: 'isDelayCorrectionOn',
      value: !isDelayCorrectionOn,
    });
  };

  const toFahrenheit = (value: number) => (value * 9) / 5 + 32;
  const unit = delayUnits === 'mm' ? 'C' : 'F';
  const min = delayUnits === 'mm' ? -20 : toFahrenheit(-20);
  const max = delayUnits === 'mm' ? 50 : toFahrenheit(50);
  const value =
    delayUnits === 'mm' ? airTemperature : toFahrenheit(airTemperature);
  const step = delayUnits === 'mm' ? 1 : 9 / 5;

  const options = [];
  for (let i = min; i <= max; i += step) {
    options.push(i.toFixed(1));
  }

  return (
    <InputGroup>
      <FormControl
        disabled={!isDelayCorrectionOn}
        value={value.toFixed(1)}
        as="select"
        placeholder="select"
        onChange={handleValueChange}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </FormControl>
      {/* InputGroup.Append was deprecated in v5? If v4 still used, fine. User uses 'react-bootstrap'.
       If using Bootstrap 5, InputGroup.Text or just Button inside InputGroup.
       Lets stick to original structure but if Append is missing in types, we might need InputGroup.Text or similar.
       However, if older react-bootstrap, Append exists.
       Original code used InputGroup.Append.
       I'll use it but monitor lint errors.
       Wait, React-Bootstrap v2 (Bootstrap 5) REMOVED InputGroup.Append. 
       If I upgraded dependencies, I likely broke this.
       I should check 'package.json' or 'task.md'.
       Task md says "Update Dependencies".
       So likely v2.
       InputGroup in v2: <InputGroup> <Button/> <FormControl/> </InputGroup> directly?
       Docs say: 
       <InputGroup>
         <Button variant="outline-secondary">Button</Button>
         <Form.Control />
       </InputGroup>
       So NO InputGroup.Append.
       I will remove InputGroup.Append wrapper.
      */}
      <Button
        variant={isDelayCorrectionOn ? 'success' : 'primary'}
        onClick={handleCorrectionChange}
      >
        °{unit}
      </Button>
    </InputGroup>
  );
}

export default React.memo(Temperature);
