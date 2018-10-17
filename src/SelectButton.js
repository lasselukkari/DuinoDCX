import React, {PureComponent} from 'react';
import {Button} from 'react-bootstrap';

class SelectButton extends PureComponent {
  render() {
    const {onChange, group, channelId, name, selected, index} = this.props;

    const muteStyle = {
      float: 'left',
      margin: '1px',
      width: '36px',
      height: '36px',
      padding: '8px'
    };

    return (
      <Button
        className="responsive-rotate-90"
        bsStyle={selected ? 'info' : 'default'}
        style={muteStyle}
        onClick={() => onChange({group, channelId, selected, index})}
      >
        {name}
      </Button>
    );
  }
}

export default SelectButton;
