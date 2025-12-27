import React, {PureComponent} from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import PropTypes from 'prop-types';
import Row from 'react-bootstrap/Row';
import pc from './parameters.tsx';

class DynamicEQ extends PureComponent {
  static defaultProps = {
    channelName: null,
  };

  static propTypes = {
    isDynamicEqOn: PropTypes.bool.isRequired,
    dynamicEqType: PropTypes.string.isRequired,
    dynamicEqFrequency: PropTypes.string.isRequired,
    dynamicEqGain: PropTypes.number.isRequired,
    dynamicEqQ: PropTypes.string.isRequired,
    dynamicEqShelving: PropTypes.string.isRequired,
    dynamicEqAttack: PropTypes.string.isRequired,
    dynamicEqRelease: PropTypes.string.isRequired,
    dynamicEqRatio: PropTypes.string.isRequired,
    dynamicEqThreshold: PropTypes.number.isRequired,
    group: PropTypes.string.isRequired,
    channelId: PropTypes.string.isRequired,
    channelName: PropTypes.string,
    onChange: PropTypes.func.isRequired,
  };

  render() {
    const {
      channelName,
      isDynamicEqOn,
      dynamicEqType,
      dynamicEqFrequency,
      dynamicEqGain,
      dynamicEqQ,
      dynamicEqShelving,
      dynamicEqAttack,
      dynamicEqRelease,
      dynamicEqRatio,
      dynamicEqThreshold,
      group,
      channelId,
      onChange,
    } = this.props;

    return (
      <Card>
        <Card.Header>
          {channelName
            ? `${channelId} . ${channelName}`
            : `Channel ${channelId}`}
        </Card.Header>
        <Card.Body>
          <pc.IsDynamicEqOn
            isTrue={isDynamicEqOn}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
          <Row>
            <Col md={12} lg={6}>
              <pc.DynamicEqType
                hasLabel
                value={dynamicEqType}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col md={12} lg={6}>
              <pc.DynamicEqFrequency
                hasLabel
                value={dynamicEqFrequency}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
          </Row>
          <Row>
            <Col md={12} lg={6}>
              {dynamicEqType === 'Bandpass' && (
                <pc.DynamicEqQ
                  hasLabel
                  value={dynamicEqQ}
                  group={group}
                  channelId={channelId}
                  onChange={onChange}
                />
              )}
              {dynamicEqType !== 'Bandpass' && (
                <pc.DynamicEqShelving
                  hasLabel
                  value={dynamicEqShelving}
                  group={group}
                  channelId={channelId}
                  onChange={onChange}
                />
              )}
            </Col>
            <Col md={12} lg={6}>
              <pc.DynamicEqAttack
                hasLabel
                value={dynamicEqAttack}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
          </Row>
          <Row>
            <Col md={12} lg={6}>
              <pc.DynamicEqRelease
                hasLabel
                value={dynamicEqRelease}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
            <Col md={12} lg={6}>
              <pc.DynamicEqRatio
                hasLabel
                value={dynamicEqRatio}
                group={group}
                channelId={channelId}
                onChange={onChange}
              />
            </Col>
          </Row>
          <pc.DynamicEqGain
            hasLabel
            value={dynamicEqGain}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
          <pc.DynamicEqThreshold
            hasLabel
            value={dynamicEqThreshold}
            group={group}
            channelId={channelId}
            onChange={onChange}
          />
        </Card.Body>
      </Card>
    );
  }
}

export default DynamicEQ;
