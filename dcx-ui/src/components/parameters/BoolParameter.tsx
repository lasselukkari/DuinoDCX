import React from 'react';
import FormGroup from 'react-bootstrap/FormGroup';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import type {ParameterTarget} from 'dcx-parser';
import {useSendCommand} from '@/hooks/useSendCommand.ts';

type Props = {
  readonly isTrue: boolean;
  readonly name: string;
  readonly target: ParameterTarget;
  readonly isInverted?: boolean;
  readonly label?: string;
  readonly hasLabel?: boolean;
};

export function BoolParameter({
  name,
  isTrue,
  target,
  isInverted = false,
  hasLabel = false,
  label,
}: Props) {
  const sendCommand = useSendCommand();
  const onColor = isInverted ? 'danger' : 'success';

  const handleClick = () => {
    void sendCommand(target, !isTrue);
  };

  return (
    <FormGroup style={{marginBottom: '15px'}}>
      {(label ?? hasLabel) ? (
        <Form.Label style={{marginBottom: '5px', display: 'block'}}>
          {label ?? name}
        </Form.Label>
      ) : undefined}

      <Button
        className="w-100"
        variant={isTrue ? onColor : 'primary'}
        onClick={handleClick}
      >
        {isTrue ? 'On' : 'Off'}
      </Button>
    </FormGroup>
  );
}

export default React.memo(BoolParameter);
