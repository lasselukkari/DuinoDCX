import React, {PureComponent} from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

class SelectButton extends PureComponent {
  render() {
    const {onChange, group, channelId, name, selected, index} = this.props;

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
        variant={selected ? 'info' : 'primary'}
        style={muteStyle}
        onClick={() => onChange({group, channelId, selected, index})}
      >
        {name}
      </Button>
    );
  }
}

SelectButton.propTypes = {
  onChange: PropTypes.func.isRequired,
  group: PropTypes.string.isRequired,
  channelId: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired
};

export default SelectButton;
