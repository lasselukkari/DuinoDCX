import React, {type ChangeEvent} from 'react';
import Form from 'react-bootstrap/Form';
import type {ParameterTarget} from 'dcx-parser';
import {useSendCommand} from '@/hooks/useSendCommand.ts';

type Props = {
  readonly value: string;
  readonly unit?: string;
  readonly enums: string[];
  readonly name: string;
  readonly target: ParameterTarget;
  readonly hasLabel?: boolean;
};

export function EnumParameter({
  name,
  value,
  enums,
  unit,
  hasLabel = false,
  target,
}: Props) {
  const sendCommand = useSendCommand();

  const handleValueChange = (event: ChangeEvent<HTMLSelectElement>) => {
    void sendCommand(target, event.target.value);
  };

  return (
    <Form.Group style={{marginBottom: '15px'}}>
      {hasLabel ? (
        <Form.Label>
          {name} {unit ? `(${unit})` : undefined}
        </Form.Label>
      ) : undefined}
      <Form.Select value={value} onChange={handleValueChange}>
        {enums.map((enumeral) => (
          <option key={enumeral}>{enumeral}</option>
        ))}
      </Form.Select>
    </Form.Group>
  );
}

export default React.memo(EnumParameter);
