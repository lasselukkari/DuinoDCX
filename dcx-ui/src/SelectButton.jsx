import React, {PureComponent} from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

class SelectButton extends PureComponent {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    group: PropTypes.string.isRequired,
    channelId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isSelected: PropTypes.bool.isRequired,
    index: PropTypes.number.isRequired
  };

  render() {
    const {onChange, group, channelId, name, isSelected, index} = this.props;

    const muteStyle = {
      float: 'left',
      margin: '1px',
      width: '36px',
      height: '36px',
      padding: '0px'
    };

    return (
      <Button
        className="responsive-rotate-90"
        variant={isSelected ? 'info' : 'primary'}
        style={muteStyle}
        onClick={() => onChange({group, channelId, isSelected, index})}
      >
        {name}
      </Button>
    );
  }
}

export default SelectButton;
