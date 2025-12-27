import React, {useMemo} from 'react';
import isEqual from 'lodash.isequal';
import {AreaChart, Area, XAxis, YAxis, Tooltip} from 'recharts';
import {useWindowSize} from '../hooks/use-window-size.ts';
import {useBreakpoint} from '../hooks/use-breakpoint.ts';
import {type Channel} from '../dcx2496/parser.tsx';
import TransferFunction from './transfer-function.tsx';
import PlotTooltip from './plot-tooltip.tsx';

const frequencyPoints = TransferFunction.generateFrequencyPoints(
  10,
  20_000,
  250,
);

type Props = {
  readonly channels: Record<string, Channel>;
  readonly isGainApplied: boolean;
};

function createPlotData(
  channels: Record<string, Channel>,
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
    tf.applyCrosover(highpassFilter, highpassFrequency, true);
    tf.applyCrosover(lowpassFilter, lowpassFrequency, false);

    return {
      data: tf.getMagnitude(),
      channel: `${index + 1}. ${channels[key].channelName}`,
      gain,
    };
  });

  return frequencyPoints.map((hz, index) => {
    const result: any = {hz};

    for (const value of values) {
      const rounded = Math.round(value.data[index] * 100) / 100;
      result[value.channel] = isGainApplied ? rounded + value.gain : rounded;
    }

    return result;
  });
}

function CrossoverPlot({channels, isGainApplied}: Props) {
  const {width: windowWidth} = useWindowSize();
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

    default: {
      width = windowWidth - 60;
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
        tickFormatter={(tick) => Math.round(tick).toString()}
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
