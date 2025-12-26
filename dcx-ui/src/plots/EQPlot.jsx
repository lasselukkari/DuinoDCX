import React, {Component} from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import windowSize from 'react-window-size';
import {withBreakpoints} from 'react-breakpoints';
import {LineChart, Line, XAxis, YAxis, Tooltip} from 'recharts';
import PlotTooltip from './PlotTooltip';
import TransferFunction from './TransferFunction';

const frequencyPoints = TransferFunction.generateFrequencyPoints(
  10,
  20000,
  250
);

class EQPlot extends Component {
  static defaultProps = {
    isGainApplied: false
  };

  static propTypes = {
    channels: PropTypes.object.isRequired,
    isGainApplied: PropTypes.bool,
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

  plotData(channels, isGainApplied) {
    const values = Object.keys(channels).map((key) => {
      const tf = new TransferFunction(frequencyPoints);

      const {eqs} = channels[key];
      Object.keys(eqs).forEach((eqsKey) => {
        const eq = eqs[eqsKey];
        if (channels[key].isEQOn === true && eq.eQGain !== 0) {
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
      <LineChart
        data={this.plotData(channels, isGainApplied)}
        width={width}
        height={height}
        margin={{top: 20, right: 30, bottom: 5, left: -30}}
      >
        <XAxis dataKey="hz" tickFormatter={(tick) => Math.round(tick)} />
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
            tickFormatterkey={channelId}
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
}

export default windowSize(withBreakpoints(EQPlot));
