import React from 'react';
import Button from 'react-bootstrap/Button';

type Props = {
  readonly isOutput?: boolean;
  readonly isLimited?: boolean;
  readonly level: number;
};

function ChannelLevel({isLimited = false, level, isOutput = false}: Props) {
  if (level === -1) {
    return undefined;
  }

  return (
    <div className="led-bar">
      <Button variant={level >= 1 ? 'success' : 'dark'} disabled={level < 1} />

      <Button variant={level >= 2 ? 'success' : 'dark'} disabled={level < 2} />

      <Button variant={level >= 3 ? 'success' : 'dark'} disabled={level < 3} />

      <Button variant={level >= 4 ? 'success' : 'dark'} disabled={level < 4} />

      <Button variant={level >= 5 ? 'warning' : 'dark'} disabled={level < 5} />

      <Button variant={level >= 6 ? 'danger' : 'dark'} disabled={level < 6} />

      {isOutput ? (
        <Button variant={isLimited ? 'danger' : 'dark'} disabled={!isLimited} />
      ) : undefined}
    </div>
  );
}

export default React.memo(ChannelLevel);
