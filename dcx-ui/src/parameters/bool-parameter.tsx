import React from 'react';
import FormGroup from 'react-bootstrap/FormGroup';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import {useSendCommand} from '../hooks/use-send-command.ts';

type Props = {
  readonly isTrue: boolean;
  readonly param: string;
  readonly name: string;
  readonly isInverted?: boolean;
  readonly group?: string;
  readonly channelId?: string;
  readonly eq?: string;
  readonly label?: string;
  readonly hasLabel?: boolean;
};

export function BoolParameter({
  name,
  isTrue,
  isInverted = false,
  hasLabel = false,
  label,
  param,
  group,
  channelId,
  eq,
}: Props) {
  const sendCommand = useSendCommand();
  const onColor = isInverted ? 'danger' : 'success';

  const handleClick = () => {
    void sendCommand({param, group, channelId, eq, value: !isTrue});
  };

  return (
    <FormGroup style={{marginBottom: '15px'}}>
      {(label ?? hasLabel) ? (
        <Form.Label style={{marginBottom: '5px', display: 'block'}}>
          {label ?? name}
        </Form.Label>
      ) : null}

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
