import React, {useState} from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import isEqual from 'lodash.isequal';
import EQPlot from './plots/e-q-plot.tsx';
import {type Channel} from './dcx2496/parser.ts';

type Props = {
  readonly channels: Record<string, Channel>;
  readonly group: string;
};

function EqPlotPanel({channels, group}: Props) {
  const [isGainApplied, setIsGainApplied] = useState(false);

  const handleToggleGain = () => {
    setIsGainApplied(!isGainApplied);
  };

  return (
    <Card>
      <Card.Header>
        EQ Frequency Response: All{' '}
        {group.charAt(0).toUpperCase() + group.slice(1)}
        <Button
          size="sm"
          className="header-button"
          variant={isGainApplied ? 'success' : 'dark'}
          onClick={handleToggleGain}
        >
          Apply Gain
        </Button>
      </Card.Header>
      <Card.Body>
        <EQPlot channels={channels} isGainApplied={isGainApplied} />
      </Card.Body>
    </Card>
  );
}

export default React.memo(EqPlotPanel, (previousProps, nextProps) => {
  return isEqual(previousProps.channels, nextProps.channels);
});
