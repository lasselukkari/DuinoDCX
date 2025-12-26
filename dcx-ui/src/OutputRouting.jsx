import React, {Component} from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import PropTypes from 'prop-types';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import OutputSources from './OutputSources';
import ChannelNames from './ChannelNames';
import pc from './parameters';

class OutputRouting extends Component {
  static propTypes = {
    setup: PropTypes.shape({
      stereolink: PropTypes.bool.isRequired,
      muteOutsWhenPowered: PropTypes.bool.isRequired,
      outputConfig: PropTypes.string.isRequired,
      crossoverLink: PropTypes.bool.isRequired
    }).isRequired,
    outputs: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  shouldComponentUpdate(nextProps) {
    const {outputs, setup} = this.props;
    return !(
      isEqual(outputs, nextProps.outputs) && isEqual(setup, nextProps.setup)
    );
  }

  render() {
    const {setup, onChange, outputs} = this.props;
    const {
      stereolink,
      muteOutsWhenPowered,
      outputConfig,
      crossoverLink
    } = setup;

    return (
      <div>
        <Card>
          <Card.Header>Link Setup</Card.Header>
          <Card.Body>
            <Row>
              <Col xs={12} sm={4}>
                <pc.OutputConfig
                  hasLabel
                  value={outputConfig}
                  onChange={onChange}
                />
              </Col>
              <Col xs={12} sm={4}>
                <pc.Stereolink
                  hasLabel
                  isTrue={stereolink}
                  onChange={onChange}
                />
              </Col>
              <Col xs={12} sm={4}>
                <pc.CrossoverLink
                  hasLabel
                  isTrue={crossoverLink}
                  onChange={onChange}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <OutputSources group="outputs" channels={outputs} onChange={onChange} />
        <ChannelNames group="outputs" channels={outputs} onChange={onChange} />
        <Card>
          <Card.Header>Mute Outs When Powered</Card.Header>
          <Card.Body>
            <pc.MuteOutsWhenPowered
              isTrue={muteOutsWhenPowered}
              onChange={onChange}
            />
          </Card.Body>
        </Card>
      </div>
    );
  }
}

export default OutputRouting;
