import React, {useMemo} from 'react';
import isEqual from 'lodash.isequal';
import {LineChart, Line, XAxis, YAxis, Tooltip} from 'recharts';
import {useWindowSize} from '../hooks/use-window-size.ts';
import {useBreakpoint} from '../hooks/use-breakpoint.ts';
import {type Channel} from '../dcx2496/parser.tsx';
import TransferFunction from './transfer-function.ts';
import PlotTooltip from './plot-tooltip.tsx';

const frequencyPoints = TransferFunction.generateFrequencyPoints(
  10,
  20_000,
  250,
);

type Props = {
  readonly channels: Record<string, Channel>;
  readonly isGainApplied?: boolean;
};

type PlotData = {
  [key: string]: number;
  hz: number;
};

function plotData(channels: Record<string, Channel>, isGainApplied: boolean) {
  const values = Object.keys(channels).map((key) => {
    const tf = new TransferFunction(frequencyPoints);

    const {eqs} = channels[key];
    if (eqs) {
      for (const eqsKey of Object.keys(eqs)) {
        const eq = eqs[Number(eqsKey)];
        if (channels[key].isEQOn === true && eq && eq.eQGain !== 0) {
          if (eq.eQType === 'Bandpass') {
            tf.parametricEQ(eq.eQFrequency ?? 0, eq.eQGain ?? 0, eq.eQQ ?? 0);
          } else {
            // eslint-disable-next-line max-depth
            if (eq.eQShelving === '6dB') {
              tf.firstOrderShelving(
                eq.eQFrequency ?? 0,
                eq.eQGain ?? 0,
                eq.eQType === 'High Shelv',
              );
            }

            if (eq.eQShelving === '12dB') {
              tf.secondOrderShelving(
                eq.eQFrequency ?? 0,
                eq.eQGain ?? 0,
                eq.eQType === 'High Shelv',
              );
            }
          }
        }
      }
    }

    return {
      gain: channels[key].gain,
      data: tf.getMagnitude(),
      channel: channels[key].channelName
        ? `${key}. ${channels[key].channelName}`
        : `Input ${key}`,
    };
  });

  return frequencyPoints.map((hz, index) => {
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

function EqualizerPlot({channels, isGainApplied = false}: Props) {
  const {width: windowWidth} = useWindowSize();
  const currentBreakpoint = useBreakpoint();

  const data = useMemo(
    () => plotData(channels, isGainApplied),
    [channels, isGainApplied],
  );

  const colors = [
    '#3498DB',
    '#307473',
    '#7A82AB',
    '#F0F3BD',
    '#375a7f',
    '#F39C12',
    '#E74C3C',
    '#95A5A6',
    '#18BC9C',
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
    <LineChart
      data={data}
      width={width}
      height={height}
      margin={{top: 20, right: 30, bottom: 5, left: -30}}
    >
      <XAxis
        dataKey="hz"
        tickFormatter={(tick: number) => Math.round(tick).toString()}
      />
      <YAxis
        allowDataOverflow
        type="number"
        domain={[isGainApplied ? 'auto' : -20, isGainApplied ? 'auto' : 20]}
      />
      <Tooltip content={<PlotTooltip />} />
      {Object.keys(channels).map((channelId, index) => (
        <Line
          key={channelId}
          type="monotone"
          dataKey={
            channels[channelId].channelName
              ? `${channelId}. ${channels[channelId].channelName}`
              : `Input ${channelId}`
          }
          dot={false}
          strokeWidth={3}
          stroke={colors[index]}
          unit="dB"
        />
      ))}
    </LineChart>
  );
}

export default React.memo(EqualizerPlot, (previousProps, nextProps) => {
  return (
    isEqual(previousProps.channels, nextProps.channels) &&
    previousProps.isGainApplied === nextProps.isGainApplied
  );
});
