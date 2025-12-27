import React from 'react';
import FormGroup from 'react-bootstrap/FormGroup';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

type Props = {
  readonly isTrue: boolean;
  readonly param: string;
  readonly name: string;
  readonly onChange: (args: {
    param: string;
    group?: string;
    channelId?: string;
    eq?: string;
    value: boolean;
  }) => void; // Value is !isTrue so boolean
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
  onChange,
}: Props) {
  const onColor = isInverted ? 'danger' : 'success';

  const handleClick = () => {
    onChange({param, group, channelId, eq, value: !isTrue});
  };

  return (
    <Form>
      <FormGroup>
        {label || hasLabel ? (
          <Form.Label>
            {label ? label : name}
            <br />
          </Form.Label>
        ) : null}

        <Button
          className="w-100"
          variant={isTrue ? onColor : 'primary'}
          active={isTrue}
          onClick={handleClick}
        >
          {isTrue ? 'On' : 'Off'}
        </Button>
      </FormGroup>
    </Form>
  );
}

export default React.memo(BoolParameter);
