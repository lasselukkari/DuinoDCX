import React, {PureComponent} from 'react';
import {Button} from 'react-bootstrap';

class ChannelLevel extends PureComponent {
  handleClick = () => {
    const {channelId, isMuted, isOutput, onChange} = this.props;
    onChange({
      param: 'mute',
      group: isOutput ? 'outputs' : 'inputs',
      channelId,
      value: !isMuted
    });
  };

  render() {
    const {limited, level, isOutput} = this.props;
    const style = {
      margin: '1px',
      cursor: 'default',
      width: '14px',
      height: '36px',
      float: 'left',
      padding: '0'
    };

    return (
      <div style={{float: 'left'}}>
        <Button
          bsStyle={level >= 1 ? 'success' : 'default'}
          disabled={level < 1}
          style={style}
        />

        <Button
          bsStyle={level >= 2 ? 'success' : 'default'}
          disabled={level < 2}
          style={style}
        />

        <Button
          bsStyle={level >= 3 ? 'success' : 'default'}
          disabled={level < 3}
          style={style}
        />

        <Button
          bsStyle={level >= 4 ? 'success' : 'default'}
          disabled={level < 4}
          style={style}
        />

        <Button
          bsStyle={level >= 5 ? 'warning' : 'default'}
          disabled={level < 5}
          style={style}
        />

        <Button
          bsStyle={level >= 6 ? 'danger' : 'default'}
          disabled={level < 6}
          style={style}
        />

        {isOutput && (
          <Button
            bsStyle={limited ? 'danger' : 'default'}
            disabled={!limited}
            style={style}
          />
        )}
      </div>
    );
  }
}

export default ChannelLevel;
