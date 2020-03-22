import React, {Component} from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import windowSize from 'react-window-size';
import {withBreakpoints} from 'react-breakpoints';
import {AreaChart, Area, XAxis, YAxis, Tooltip} from 'recharts';
import PlotTooltip from './PlotTooltip';
import TransferFunction from './TransferFunction';

const frequencyPoints = TransferFunction.generateFrequencyPoints(
  10,
  20000,
  250
);

class CrossoverPlot extends Component {
  static propTypes = {
    channels: PropTypes.object.isRequired,
    isGainApplied: PropTypes.bool.isRequired,
    windowWidth: PropTypes.number.isRequired,
    currentBreakpoint: PropTypes.string.isRequired
  };

  shouldComponentUpdate(nextProps) {
    const {
      channels,
      isGainApplied,
      windowWidth,
      currentBreakpoint
    } = this.props;

    if (!isEqual(channels, nextProps.channels)) {
      return true;
    }

    if (isGainApplied !== nextProps.isGainApplied) {
      return true;
    }

    if (
      nextProps.currentBreakpoint === 'xs' &&
      windowWidth !== nextProps.windowWidth
    ) {
      return true;
    }

    if (currentBreakpoint !== nextProps.currentBreakpoint) {
      return true;
    }

    return false;
  }

  createPlotData(channels, isGainApplied) {
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

      values.forEach((value) => {
        const rounded = Math.round(value.data[index] * 100) / 100;
        result[value.channel] = isGainApplied ? rounded + value.gain : rounded;
      });

      return result;
    });
  }

  render() {
    const {
      channels,
      isGainApplied,
      windowWidth,
      currentBreakpoint
    } = this.props;
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

    switch (currentBreakpoint) {
      case 'sm':
        width = 480;
        break;
      case 'md':
        width = 660;
        break;
      case 'lg':
        width = 900;
        break;
      case 'xl':
        width = 1080;
        break;
      default:
        width = windowWidth - 60;
    }

    const height = width * 0.33;

    return (
      <AreaChart
        data={this.createPlotData(channels, isGainApplied)}
        width={width}
        height={height}
        baseValue="dataMin"
        margin={{top: 20, right: 10, bottom: 5, left: -30}}
      >
        <XAxis dataKey="hz" tickFormatter={(tick) => Math.round(tick)} />
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
}

export default windowSize(withBreakpoints(CrossoverPlot));
