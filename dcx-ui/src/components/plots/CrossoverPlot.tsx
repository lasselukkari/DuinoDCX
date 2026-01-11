import React, {useMemo} from 'react';
import isEqual from 'react-fast-compare';
import {AreaChart, Area, XAxis, YAxis, Tooltip} from 'recharts';
import {type OutputChannel} from 'dcx-parser';
import {useWindowSize} from '@/hooks/useWindowSize.ts';
import {useBreakpoint} from '@/hooks/useBreakpoint.ts';
import TransferFunction from '@/components/plots/TransferFunction.js';
import PlotTooltip from '@/components/plots/PlotTooltip.tsx';

const frequencyPoints = TransferFunction.generateFrequencyPoints(
  10,
  20_000,
  250,
);

type Props = {
  readonly channels: Record<string, OutputChannel>;
  readonly isGainApplied: boolean;
};

type PlotData = {
  [key: string]: number;
  hz: number;
};

function createPlotData(
  channels: Record<string, OutputChannel>,
  isGainApplied: boolean,
) {
  const values = Object.keys(channels).map((key, index) => {
    const tf = new TransferFunction(frequencyPoints);

    const {
      highpassFilter,
      highpassFrequency,
      lowpassFilter,
      lowpassFrequency,
      gain,
    } = channels[key];
    tf.applyCrossover(
      highpassFilter ?? '',
      Number(highpassFrequency ?? 20),
      true,
    );
    tf.applyCrossover(
      lowpassFilter ?? '',
      Number(lowpassFrequency ?? 20),
      false,
    );

    return {
      data: tf.getMagnitude(),
      channel: `${index + 1}. ${channels[key].channelName}`,
      gain,
    };
  });

  return frequencyPoints.map((hz: number, index: number) => {
    const result: PlotData = {hz};

    for (const value of values) {
      const rounded = Math.round(value.data[index] * 100) / 100;
      result[value.channel] = isGainApplied
        ? rounded + (value.gain ?? 0)
        : rounded;
    }

    return result;
  });
}

function CrossoverPlot({channels, isGainApplied}: Props) {
  useWindowSize(); // Trigger re-render on resize
  const currentBreakpoint = useBreakpoint();

  const data = useMemo(
    () => createPlotData(channels, isGainApplied),
    [channels, isGainApplied],
  );

  const colors = [
    '#307473',
    '#7A82AB',
    '#F0F3BD',
    '#375a7f',
    '#18BC9C',
    '#3498DB',
    '#F39C12',
    '#E74C3C',
    '#95A5A6',
  ];

  let width;

  switch (currentBreakpoint) {
    case 'xs':
    case 'sm': {
      width = 480;
      break;
    }

    case 'md': {
      width = 660;
      break;
    }

    case 'lg': {
      width = 900;
      break;
    }

    case 'xl': {
      width = 1080;
      break;
    }
  }

  const height = width * 0.33;

  return (
    <AreaChart
      data={data}
      width={width}
      height={height}
      margin={{top: 20, right: 10, bottom: 5, left: -30}}
    >
      <XAxis
        dataKey="hz"
        tickFormatter={(tick: number) => Math.round(tick).toString()}
      />
      <YAxis
        allowDataOverflow
        type="number"
        domain={[-20, isGainApplied ? 'auto' : 5]}
      />
      <Tooltip content={<PlotTooltip filter={({value}) => value > -20} />} />
      {Object.keys(channels).map((channelId, index) => (
        <Area
          key={channelId}
          type="monotone"
          dataKey={`${index + 1}. ${channels[channelId].channelName}`}
          strokeWidth={3}
          stroke={colors[index]}
          fill={colors[index]}
          fillOpacity={0.2}
          unit="dB"
          baseValue={-20}
        />
      ))}
    </AreaChart>
  );
}

export default React.memo(CrossoverPlot, (previousProps, nextProps) => {
  return (
    isEqual(previousProps.channels, nextProps.channels) &&
    previousProps.isGainApplied === nextProps.isGainApplied
  );
});
