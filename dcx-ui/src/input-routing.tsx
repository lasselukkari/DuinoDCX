import {memo} from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import pc from './parameters/index.tsx';
import {type Setup} from './dcx2496/parser.ts';

type Props = {
  readonly setup: Setup;
};

function InputRouting({setup}: Props) {
  const {
    inputABSource,
    inputCGain,
    stereolinkMode,
    inputSumType,
    inputASumGain,
    inputBSumGain,
    inputCSumGain,
  } = setup;

  return (
    <div>
      <Card>
        <Card.Header>Source Setup</Card.Header>
        <Card.Body>
          <Row>
            <Col xs={12} sm={4}>
              <pc.InputABSource hasLabel value={inputABSource} />
            </Col>
            <Col xs={12} sm={4}>
              <pc.InputCGain hasLabel value={inputCGain} />
            </Col>
            <Col xs={12} sm={4}>
              <pc.StereolinkMode hasLabel value={stereolinkMode} />
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header>Sum Setup</Card.Header>
        <Card.Body>
          <pc.InputSumType hasLabel value={inputSumType} />
          <pc.InputASumGain hasLabel value={inputASumGain} />
          <pc.InputBSumGain hasLabel value={inputBSumGain} />
          <pc.InputCSumGain hasLabel value={inputCSumGain} />
        </Card.Body>
      </Card>
    </div>
  );
}

export default memo(InputRouting, (previousProps, nextProps) => {
  return isEqual(previousProps.setup, nextProps.setup);
});
