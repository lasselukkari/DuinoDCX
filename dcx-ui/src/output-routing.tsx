import {memo} from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import OutputSources from './output-sources.tsx';
import ChannelNames from './channel-names.tsx';
import pc from './parameters/index.tsx';
import {type Channel, type Setup} from './dcx2496/parser.ts';

type Props = {
  readonly setup: Setup;
  readonly outputs: Record<string, Channel>;
};

function OutputRouting({setup, outputs}: Props) {
  const {stereolink, muteOutsWhenPowered, outputConfig, crossoverLink} = setup;

  return (
    <div>
      <Card>
        <Card.Header>Link Setup</Card.Header>
        <Card.Body>
          <Row>
            <Col xs={12} sm={4}>
              <pc.OutputConfig hasLabel value={outputConfig ?? 'MONO'} />
            </Col>
            <Col xs={12} sm={4}>
              <pc.Stereolink hasLabel value={stereolink ?? false} />
            </Col>
            <Col xs={12} sm={4}>
              <pc.CrossoverLink hasLabel value={crossoverLink ?? false} />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <OutputSources group="outputs" channels={outputs} />
      <ChannelNames group="outputs" channels={outputs} />
      <Card>
        <Card.Header>Mute Outs When Powered</Card.Header>
        <Card.Body>
          <pc.MuteOutsWhenPowered value={muteOutsWhenPowered ?? false} />
        </Card.Body>
      </Card>
    </div>
  );
}

export default memo(OutputRouting, (previousProps, nextProps) => {
  return (
    isEqual(previousProps.outputs, nextProps.outputs) &&
    isEqual(previousProps.setup, nextProps.setup)
  );
});
