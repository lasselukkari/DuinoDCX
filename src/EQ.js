import React, {PureComponent} from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Dialog from 'react-bootstrap-dialog';
import PropTypes from 'prop-types';
import Row from 'react-bootstrap/Row';
import pc from './parameters';

class EQ extends PureComponent {
  static propTypes = {
    channelId: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    group: PropTypes.string.isRequired,
    eQType: PropTypes.string.isRequired,
    eQFrequency: PropTypes.string.isRequired,
    eQQ: PropTypes.string.isRequired,
    eQShelving: PropTypes.string.isRequired,
    eQGain: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
  };

  confirmChange = ({oldValue, newValue, name, unit, formatter}) => {
    return new Promise((resolve, reject) => {
      if (newValue - oldValue <= 6) {
        return resolve();
      }

      this.dialog.show({
        title: 'Confirm change',
        body: (
          <div style={{textAlign: 'center'}}>
            <p>
              You are about to change {name.toLowerCase()} from{' '}
              {formatter(oldValue, unit)} to {formatter(newValue, unit)}.
            </p>
            <p>
              This is {formatter(newValue - oldValue, unit)} increase. Are you
              sure?
            </p>
          </div>
        ),
        bsSize: 'md',
        actions: [
          Dialog.CancelAction(() => reject()), // eslint-disable-line new-cap
          Dialog.OKAction(() => resolve()) // eslint-disable-line new-cap
        ],
        onHide: dialog => {
          dialog.hide();
          reject();
        }
      });
    });
  };

  render() {
    const {
      eQType,
      eQFrequency,
      eQQ,
      eQShelving,
      eQGain,
      id,
      onChange,
      group,
      channelId
    } = this.props;

    return (
      <Card>
        <Card.Header>{`Equalizer ${id}`}</Card.Header>
        <Card.Body>
          <Row>
            <Col xs={12} sm={4}>
              <pc.EQType
                includeLabel
                value={eQType}
                eq={id}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col xs={12} sm={4}>
              <pc.EQFrequency
                includeLabel
                value={eQFrequency}
                eq={id}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col xs={12} sm={4}>
              {eQType === 'Bandpass' && (
                <pc.EQQ
                  includeLabel
                  value={eQQ}
                  eq={id}
                  group={group}
                  channelId={channelId}
                  onChange={onChange}
                />
              )}
              {eQType !== 'Bandpass' && (
                <pc.EQShelving
                  includeLabel
                  value={eQShelving}
                  eq={id}
                  group={group}
                  channelId={channelId}
                  onChange={onChange}
                />
              )}
            </Col>
          </Row>
          <pc.EQGain
            includeLabel
            value={eQGain}
            eq={id}
            group={group}
            channelId={channelId}
            confirm={this.confirmChange}
            onChange={onChange}
          />
        </Card.Body>
        <Dialog
          ref={el => {
            this.dialog = el;
          }}
        />
      </Card>
    );
  }
}

export default EQ;
