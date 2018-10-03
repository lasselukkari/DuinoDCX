import React, {PureComponent} from 'react';
import windowSize from 'react-window-size';
import {LineChart, Line, XAxis, YAxis, Tooltip} from 'recharts';
import TransferFunction from './TransferFunction';

const frequencyPoints = TransferFunction.generateFrequencyPoints(
  10.0,
  20000.0,
  250
);

class EQPlot extends PureComponent {
  plotData(channels, applyGain) {
    const values = Object.keys(channels).map(key => {
      const tf = new TransferFunction(frequencyPoints);

      const {eqs} = channels[key];
      Object.keys(eqs).forEach(eqsKey => {
        const eq = eqs[eqsKey];
        if (channels[key].eQ === true && eq.eQGain !== 0) {
          if (eq.eQType === 'Bandpass') {
            tf.parametricEQ(eq.eQFrequency, eq.eQGain, eq.eQQ);
          } else {
            if (eq.eQShelving === '6dB') {
              tf.firstOrderShelving(
                eq.eQFrequency,
                eq.eQGain,
                eq.eQType === 'High Shelv'
              );
            }

            if (eq.eQShelving === '12dB') {
              tf.secondOrderShelving(
                eq.eQFrequency,
                eq.eQGain,
                eq.eQType === 'High Shelv'
              );
            }
          }
        }
      });

      return {
        gain: channels[key].gain,
        data: tf.getMagnitude(),
        channel: channels[key].channelName
          ? `${key}. ${channels[key].channelName}`
          : `Input ${key}`
      };
    });
    return frequencyPoints.map((hz, index) => {
      const result = {hz};
      values.forEach(value => {
        const rounded = Math.round(value.data[index] * 100) / 100;
        result[value.channel] = applyGain ? rounded + value.gain : rounded;
      });
      return result;
    });
  }

  /* eslint-disable no-undef */
  formatTooltip = magnitude => `${magnitude.toFixed(2)} dB`;

  formatTic = tick => Math.round(tick);

  formatLabel = frequency => `${Math.round(frequency)} Hz`;
  /* eslint-enable no-undef */

  render() {
    const {channels, applyGain, windowWidth} = this.props;
    const colors = [
      '#3498DB',
      '#307473',
      '#7A82AB',
      '#F0F3BD',
      '#375a7f',
      '#F39C12',
      '#E74C3C',
      '#95A5A6',
      '#18BC9C'
    ];
    let width;
    if (windowWidth < 768) {
      width = windowWidth - 70;
    } else if (windowWidth < 992) {
      width = 688;
    } else if (windowWidth < 1200) {
      width = 892;
    } else {
      width = 1100;
    }
    const height = width * 0.33;

    return (
      <LineChart
        data={this.plotData(channels, applyGain)}
        width={width}
        height={height}
        margin={{top: 20, right: 30, bottom: 5, left: -30}}
      >
        <XAxis dataKey="hz" tickFormatter={this.formatTic} />
        <YAxis
          allowDataOverflow
          type="number"
          domain={[applyGain ? 'auto' : -20, applyGain ? 'auto' : 20]}
        />
        <Tooltip
          labelFormatter={this.formatLabel}
          formatter={this.formatTooltip}
        />
        {Object.keys(channels).map((channelId, index) => (
          <Line
            key={channelId}
            type="monotone"
            tickFormatterkey={channelId}
            dataKey={
              channels[channelId].channelName
                ? `${channelId}. ${channels[channelId].channelName}`
                : `Input ${channelId}`
            }
            dot={false}
            strokeWidth={3}
            stroke={colors[index]}
          />
        ))}
      </LineChart>
    );
  }
}

export default windowSize(EQPlot);
