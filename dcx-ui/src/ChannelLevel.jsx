import React, {PureComponent} from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

class ChannelLevel extends PureComponent {
  static propTypes = {
    isOutput: PropTypes.bool.isRequired,
    isLimited: PropTypes.bool.isRequired,
    level: PropTypes.number.isRequired
  };

  render() {
    const {isLimited, level, isOutput} = this.props;

    if (level === -1) {
      return null;
    }

    return (
      <div className="led-bar">
        <Button
          variant={level >= 1 ? 'success' : 'dark'}
          disabled={level < 1}
        />

        <Button
          variant={level >= 2 ? 'success' : 'dark'}
          disabled={level < 2}
        />

        <Button
          variant={level >= 3 ? 'success' : 'dark'}
          disabled={level < 3}
        />

        <Button
          variant={level >= 4 ? 'success' : 'dark'}
          disabled={level < 4}
        />

        <Button
          variant={level >= 5 ? 'warning' : 'dark'}
          disabled={level < 5}
        />

        <Button variant={level >= 6 ? 'danger' : 'dark'} disabled={level < 6} />

        {isOutput && (
          <Button
            variant={isLimited ? 'danger' : 'dark'}
            disabled={!isLimited}
          />
        )}
      </div>
    );
  }
}

export default ChannelLevel;
