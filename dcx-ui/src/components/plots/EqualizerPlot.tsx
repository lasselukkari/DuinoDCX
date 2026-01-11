import React, {useMemo} from 'react';
import isEqual from 'react-fast-compare';
import {LineChart, Line, XAxis, YAxis, Tooltip} from 'recharts';
import {type Channel, isOutputChannel, type Equalizer} from 'dcx-parser';
import {useWindowSize} from '@/hooks/useWindowSize.js';
import {useBreakpoint} from '@/hooks/useBreakpoint.js';
import TransferFunction from '@/components/plots/TransferFunction.js';
import PlotTooltip from '@/components/plots/PlotTooltip.js';

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
    const channel = channels[key];
    const {equalizers} = channel;

    if (channel.isEqualizerOn && equalizers) {
      for (const eqsKey of Object.keys(equalizers)) {
        const eq = equalizers[Number(eqsKey)];
        if (!eq || eq.equalizerGain === 0) {
          continue;
        }

        if (eq.equalizerType === 'Bandpass') {
          tf.parametricEQ(
            Number.parseFloat(eq.equalizerFrequency) || 0,
            eq.equalizerGain ?? 0,
            Number.parseFloat(eq.equalizerQ) || 0,
          );
          continue;
        }

        const processShelving = (
          eq: Equalizer,
          isHighShelv: boolean,
          order: '6dB' | '12dB',
        ) => {
          const freq = Number.parseFloat(eq.equalizerFrequency ?? '20');
          const gain = eq.equalizerGain ?? 0;
          if (order === '6dB') {
            if (isHighShelv) {
              tf.highShelving1stOrder(freq, gain);
            } else {
              tf.lowShelving1stOrder(freq, gain);
            }
          } else if (isHighShelv) {
            tf.highShelving(freq, gain);
          } else {
            tf.lowShelving(freq, gain);
          }
        };

        if (eq.equalizerShelving === '6dB') {
          processShelving(eq, eq.equalizerType === 'High Shelv', '6dB');
        } else if (eq.equalizerShelving === '12dB') {
          processShelving(eq, eq.equalizerType === 'High Shelv', '12dB');
        }
      }
    }

    return {
      gain: channel.gain,
      data: tf.getMagnitude(),
      channel:
        isOutputChannel(channel) && channel.channelName
          ? `${key}. ${channel.channelName}`
          : `Channel ${key}`,
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

function EqualizerPlot({channels, isGainApplied = false}: Props) {
  useWindowSize();
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

  let width = 1080;

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
            isOutputChannel(channels[channelId]) &&
            channels[channelId].channelName
              ? `${channelId}. ${channels[channelId].channelName}`
              : `Channel ${channelId}`
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
