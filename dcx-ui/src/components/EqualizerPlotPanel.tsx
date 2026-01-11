import React, {useState} from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import isEqual from 'react-fast-compare';
import {type Channel} from 'dcx-parser';
import EqualizerPlot from '@/components/plots/EqualizerPlot.tsx';

type Props = {
  readonly channels: Record<string, Channel>;
  readonly group: string;
};

function EqualizerPlotPanel({channels, group}: Props) {
  const [isGainApplied, setIsGainApplied] = useState(false);

  const handleToggleGain = () => {
    setIsGainApplied(!isGainApplied);
  };

  return (
    <Card>
      <Card.Header>
        Equalizer Frequency Response: All{' '}
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
        <EqualizerPlot channels={channels} isGainApplied={isGainApplied} />
      </Card.Body>
    </Card>
  );
}

export default React.memo(EqualizerPlotPanel, (previousProps, nextProps) => {
  return isEqual(previousProps.channels, nextProps.channels);
});
