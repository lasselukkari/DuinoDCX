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

    return (
      <div className="led-bar">
        <Button
          bsStyle={level >= 1 ? 'success' : 'default'}
          disabled={level < 1}
        />

        <Button
          bsStyle={level >= 2 ? 'success' : 'default'}
          disabled={level < 2}
        />

        <Button
          bsStyle={level >= 3 ? 'success' : 'default'}
          disabled={level < 3}
        />

        <Button
          bsStyle={level >= 4 ? 'success' : 'default'}
          disabled={level < 4}
        />

        <Button
          bsStyle={level >= 5 ? 'warning' : 'default'}
          disabled={level < 5}
        />

        <Button
          bsStyle={level >= 6 ? 'danger' : 'default'}
          disabled={level < 6}
        />

        {isOutput && (
          <Button
            bsStyle={limited ? 'danger' : 'default'}
            disabled={!limited}
          />
        )}
      </div>
    );
  }
}

export default ChannelLevel;
