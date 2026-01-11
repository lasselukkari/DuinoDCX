import {memo} from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'react-fast-compare';
import {type Setup} from 'dcx-parser';
import {setup as setupParameters} from '@/components/parameters/index.tsx';

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
              <setupParameters.InputABSource
                hasLabel
                value={inputABSource ?? ''}
              />
            </Col>
            <Col xs={12} sm={4}>
              <setupParameters.InputCGain hasLabel value={inputCGain ?? ''} />
            </Col>
            <Col xs={12} sm={4}>
              <setupParameters.StereolinkMode
                hasLabel
                value={stereolinkMode ?? ''}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header>Sum Setup</Card.Header>
        <Card.Body>
          <setupParameters.InputSumType hasLabel value={inputSumType ?? ''} />
          <setupParameters.InputASumGain hasLabel value={inputASumGain ?? 0} />
          <setupParameters.InputBSumGain hasLabel value={inputBSumGain ?? 0} />
          <setupParameters.InputCSumGain hasLabel value={inputCSumGain ?? 0} />
        </Card.Body>
      </Card>
    </div>
  );
}

export default memo(InputRouting, (previousProps, nextProps) => {
  return isEqual(previousProps.setup, nextProps.setup);
});
