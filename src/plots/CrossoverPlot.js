import React, {PureComponent} from 'react';
import {AreaChart, Area, XAxis, YAxis, Tooltip} from 'recharts';
import windowSize from 'react-window-size';
import PlotTooltip from './PlotTooltip';
import TransferFunction from './TransferFunction';

const frequencyPoints = TransferFunction.generateFrequencyPoints(
  10.0,
  20000.0,
  250
);

class CrossoverPlot extends PureComponent {
  createPlotData(channels, applyGain) {
    const values = Object.keys(channels).map((key, index) => {
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
        channel: `${index + 1}. ${channels[key].channelName}`,
        gain
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

  render() {
    const {channels, applyGain, windowWidth} = this.props;
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
    if (windowWidth < 576) {
      width = windowWidth - 60;
    } else if (windowWidth < 768) {
      width = 480;
    } else if (windowWidth < 992) {
      width = 660;
    } else if (windowWidth < 1200) {
      width = 900;
    } else {
      width = 1080;
    }
    const height = width * 0.33;

    return (
      <AreaChart
        data={this.createPlotData(channels, applyGain)}
        width={width}
        height={height}
        baseValue="dataMin"
        margin={{top: 20, right: 10, bottom: 5, left: -30}}
      >
        <XAxis dataKey="hz" tickFormatter={tick => Math.round(tick)} />
        <YAxis
          allowDataOverflow
          type="number"
          domain={[-20, applyGain ? 'auto' : 5]}
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
}

export default windowSize(CrossoverPlot);
