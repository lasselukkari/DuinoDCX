import React from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import isEqual from 'lodash.isequal';
import pc from './parameters.tsx';

type Props = {
  readonly setup: {
    inputABSource: string;
    stereolinkMode: string;
    inputSumType: string;
    inputCGain: string;
    inputASumGain: number;
    inputBSumGain: number;
    inputCSumGain: number;
  };
  readonly onChange: (args: any) => void;
};

function InputRouting({setup, onChange}: Props) {
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
              <pc.InputABSource
                hasLabel
                value={inputABSource}
                onChange={onChange}
              />
            </Col>
            <Col xs={12} sm={4}>
              <pc.InputCGain hasLabel value={inputCGain} onChange={onChange} />
            </Col>
            <Col xs={12} sm={4}>
              <pc.StereolinkMode
                hasLabel
                value={stereolinkMode}
                onChange={onChange}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header>Sum Setup</Card.Header>
        <Card.Body>
          <pc.InputSumType hasLabel value={inputSumType} onChange={onChange} />
          <pc.InputASumGain
            hasLabel
            value={inputASumGain}
            onChange={onChange}
          />
          <pc.InputBSumGain
            hasLabel
            value={inputBSumGain}
            onChange={onChange}
          />
          <pc.InputCSumGain
            hasLabel
            value={inputCSumGain}
            onChange={onChange}
          />
        </Card.Body>
      </Card>
    </div>
  );
}

export default React.memo(InputRouting, (previousProps, nextProps) => {
  return isEqual(previousProps.setup, nextProps.setup);
});
