import React, { type ChangeEvent } from 'react';
import Form from 'react-bootstrap/Form';

type Props = {
  readonly value: string;
  readonly unit?: string;
  readonly enums: string[];
  readonly param: string;
  readonly name: string;
  readonly onChange: (args: {
    param: string;
    group?: string;
    channelId?: string;
    eq?: string;
    value: string;
  }) => void;
  readonly group?: string;
  readonly channelId?: string;
  readonly eq?: string;
  readonly hasLabel?: boolean;
};

export function EnumParameter({
  name,
  value,
  enums,
  unit,
  hasLabel = false,
  param,
  group,
  channelId,
  eq,
  onChange,
}: Props) {
  const handleValueChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange({ param, group, channelId, eq, value: event.target.value });
  };

  return (
    <Form.Group style={{ marginBottom: '15px' }}>
      {hasLabel ? (
        <Form.Label>
          {name} {unit ? `(${unit})` : null}
        </Form.Label>
      ) : null}
      <Form.Select value={value} onChange={handleValueChange}>
        {enums.map((enumeral) => (
          <option key={enumeral}>{enumeral}</option>
        ))}
      </Form.Select>
    </Form.Group>
  );
}

export default React.memo(EnumParameter);
