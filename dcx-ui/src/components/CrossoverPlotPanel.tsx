import React, {useState} from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import isEqual from 'react-fast-compare';
import {type OutputChannel} from 'dcx-parser';
import CrossoverPlot from '@/components/plots/CrossoverPlot.tsx';

type Props = {
  readonly channels: Record<string, OutputChannel>;
};

function CrossoverPlotPanel({channels}: Props) {
  const [isGainApplied, setIsGainApplied] = useState(false);

  const handleToggleGain = () => {
    setIsGainApplied(!isGainApplied);
  };

  return (
    <Card>
      <Card.Header>
        Crossover Frequency Response
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
        <CrossoverPlot channels={channels} isGainApplied={isGainApplied} />
      </Card.Body>
    </Card>
  );
}

export default React.memo(CrossoverPlotPanel, (previousProps, nextProps) => {
  return isEqual(previousProps.channels, nextProps.channels);
});
