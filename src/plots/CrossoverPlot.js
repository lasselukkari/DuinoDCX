import React, {PureComponent} from 'react';
import {LineChart, Line, XAxis, YAxis, Tooltip} from 'recharts';
import windowSize from 'react-window-size';
import mathjs from 'mathjs';
import TransferFunction from './TransferFunction';

const frequencyPoints = TransferFunction.generateFrequencyPoints(
  10.0,
  20000.0,
  250
);

class CrossoverPlot extends PureComponent {
  createPlotData(channels) {
    const values = Object.keys(channels).map(key => {
      const tf = new TransferFunction(frequencyPoints);

      const {
        highpassFilter,
        highpassFrequency,
        lowpassFilter,
        lowpassFrequency,
        gain
      } = channels[key];
      tf.applyCrosover(highpassFilter, highpassFrequency, true);
      tf.applyCrosover(lowpassFilter, lowpassFrequency, false);

      return {
        data: tf.getMagnitude(),
        channel: channels[key].channelName,
        gain
      };
    });

    return frequencyPoints.map((hz, index) => {
      const result = {hz};

      values.forEach(value => {
        result[value.channel] = mathjs.add(value.data[index], value.gain);
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
    const {channels, windowWidth} = this.props;
    const colors = [
      '#307473',
      '#7A82AB',
      '#F0F3BD',
      '#375a7f',
      '#18BC9C',
      '#3498DB',
      '#F39C12',
      '#E74C3C',
      '#95A5A6'
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
        data={this.createPlotData(channels)}
        width={width}
        height={height}
        margin={{top: 20, right: 10, bottom: 5, left: -30}}
      >
        <XAxis dataKey="hz" tickFormatter={this.formatTic} />
        <YAxis allowDataOverflow type="number" domain={[-20, 5]} />
        <Tooltip
          labelFormatter={this.formatLabel}
          formatter={this.formatTooltip}
        />
        {Object.keys(channels).map((channelId, index) => (
          <Line
            key={channelId}
            type="monotone"
            dataKey={channels[channelId].channelName}
            dot={false}
            strokeWidth={3}
            stroke={colors[index]}
          />
        ))}
      </LineChart>
    );
  }
}

export default windowSize(CrossoverPlot);
