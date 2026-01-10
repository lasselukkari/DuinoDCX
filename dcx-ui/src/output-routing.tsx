import { memo } from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import OutputSources from './output-sources.tsx';
import ChannelNames from './channel-names.tsx';
import { setup as setupParameters } from './parameters/index.tsx';
import { type Setup, type OutputChannel } from 'dcx-parser';

type Props = {
  readonly setup: Setup;
  readonly outputs: Record<string, OutputChannel>;
};

function OutputRouting({ setup, outputs }: Props) {
  const { stereolink, muteOutsWhenPowered, outputConfig, crossoverLink } = setup;

  return (
    <div>
      <Card>
        <Card.Header>Link Setup</Card.Header>
        <Card.Body>
          <Row>
            <Col xs={12} sm={4}>
              <setupParameters.OutputConfig
                hasLabel
                value={outputConfig ?? 'MONO'}
              />
            </Col>
            <Col xs={12} sm={4}>
              <setupParameters.Stereolink
                hasLabel
                value={stereolink ?? false}
              />
            </Col>
            <Col xs={12} sm={4}>
              <setupParameters.CrossoverLink
                hasLabel
                value={crossoverLink ?? false}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <OutputSources channels={outputs} />
      <ChannelNames channels={outputs} />
      <Card>
        <Card.Header>Mute Outs When Powered</Card.Header>
        <Card.Body>
          <setupParameters.MuteOutsWhenPowered
            value={muteOutsWhenPowered ?? false}
          />
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
