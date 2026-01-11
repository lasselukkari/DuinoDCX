import {memo, type ChangeEvent} from 'react';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import {useSendCommand} from '@/hooks/useSendCommand.js';

type Props = {
  readonly delayUnits: string;
  readonly airTemperature: number;
  readonly isDelayCorrectionOn: boolean;
};

function Temperature({delayUnits, airTemperature, isDelayCorrectionOn}: Props) {
  const sendCommand = useSendCommand();

  const handleValueChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const {value} = event.target;
    const numericValue = Number(value);

    const unlocalizedValue =
      delayUnits === 'mm' ? numericValue : ((numericValue - 32) * 5) / 9;

    void sendCommand({kind: 'setup', key: 'airTemperature'}, unlocalizedValue);
  };

  const handleCorrectionChange = () => {
    void sendCommand(
      {kind: 'setup', key: 'isDelayCorrectionOn'},
      !isDelayCorrectionOn,
    );
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
      <Button
        variant={isDelayCorrectionOn ? 'success' : 'primary'}
        onClick={handleCorrectionChange}
      >
        °{unit}
      </Button>
    </InputGroup>
  );
}

export default memo(Temperature);
